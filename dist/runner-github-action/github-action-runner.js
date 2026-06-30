import { spawn } from "node:child_process";
import { DefaultRedactor } from "@vioxen/subscription-runtime/core";
import { githubActionRunnerCapabilities } from "./capabilities.js";
const defaultMaxCapturedOutputBytes = 256_000;
const defaultKillGraceMs = 5_000;
export class GitHubActionRunner {
    runnerId = githubActionRunnerCapabilities.runnerId;
    capabilities = githubActionRunnerCapabilities;
    redactor;
    maxCapturedOutputBytes;
    killGraceMs;
    constructor(options = {}) {
        this.redactor = options.redactor ?? new DefaultRedactor();
        this.maxCapturedOutputBytes =
            options.maxCapturedOutputBytes ?? defaultMaxCapturedOutputBytes;
        this.killGraceMs = options.killGraceMs ?? defaultKillGraceMs;
    }
    run(input) {
        try {
            assertSafeProcessInput(input);
        }
        catch (error) {
            return Promise.reject(error);
        }
        if (input.abortSignal.aborted) {
            return Promise.reject(new Error("process_aborted"));
        }
        return new Promise((resolve, reject) => {
            const startedAt = Date.now();
            const stdoutChunks = [];
            const stderrChunks = [];
            let capturedBytes = 0;
            let settled = false;
            let terminalError = null;
            let forceKillTimer = null;
            const child = spawn(input.command, input.args, {
                cwd: input.cwd,
                env: input.env,
                stdio: ["pipe", "pipe", "pipe"],
            });
            const cleanup = () => {
                clearTimeout(timer);
                if (forceKillTimer)
                    clearTimeout(forceKillTimer);
                input.abortSignal.removeEventListener("abort", abort);
            };
            const settleReject = (error) => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                reject(error);
            };
            const terminate = () => {
                if (child.exitCode !== null || child.signalCode !== null)
                    return;
                child.kill("SIGTERM");
                forceKillTimer ??= setTimeout(() => {
                    if (child.exitCode === null && child.signalCode === null) {
                        child.kill("SIGKILL");
                    }
                }, this.killGraceMs);
            };
            const failAfterExit = (error) => {
                if (settled || terminalError)
                    return;
                terminalError = error;
                terminate();
            };
            const abort = () => {
                failAfterExit(new Error("process_aborted"));
            };
            const timer = setTimeout(() => {
                failAfterExit(new Error("process_timeout"));
            }, input.timeoutMs);
            const failOutputSink = (streamName, error) => {
                const message = error instanceof Error ? error.message : String(error);
                failAfterExit(new Error(`process_output_sink_failed:${streamName}:${message}`));
            };
            const failStdin = (error) => {
                const message = error instanceof Error ? error.message : String(error);
                failAfterExit(new Error(`process_stdin_failed:${message}`));
            };
            input.abortSignal.addEventListener("abort", abort, { once: true });
            child.stdout.on("data", (chunk) => {
                const buffer = Buffer.from(chunk);
                try {
                    writeRedacted(input.stdout, this.redactor, buffer);
                }
                catch (error) {
                    failOutputSink("stdout", error);
                    return;
                }
                capturedBytes = appendCapturedChunk(stdoutChunks, capturedBytes, buffer, this.maxCapturedOutputBytes);
            });
            child.stderr.on("data", (chunk) => {
                const buffer = Buffer.from(chunk);
                try {
                    writeRedacted(input.stderr, this.redactor, buffer);
                }
                catch (error) {
                    failOutputSink("stderr", error);
                    return;
                }
                capturedBytes = appendCapturedChunk(stderrChunks, capturedBytes, buffer, this.maxCapturedOutputBytes);
            });
            child.on("error", (error) => {
                if (terminalError)
                    return;
                settleReject(error instanceof Error ? error : new Error(String(error)));
            });
            child.stdin.on("error", failStdin);
            child.on("close", (code) => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                if (terminalError) {
                    reject(terminalError);
                    return;
                }
                const stdout = this.redactor.redact(Buffer.concat(stdoutChunks).toString("utf8"));
                const stderr = this.redactor.redact(Buffer.concat(stderrChunks).toString("utf8"));
                const durationMs = Date.now() - startedAt;
                if (code === 0) {
                    resolve({
                        exitCode: 0,
                        stdout,
                        stderr,
                        durationMs,
                    });
                    return;
                }
                reject(new Error(`process_failed:${input.command}:${code ?? "signal"}:${safeFailureOutput(`${stdout}\n${stderr}`)}`));
            });
            try {
                child.stdin.end(input.stdin ? Buffer.from(input.stdin) : undefined);
            }
            catch (error) {
                failStdin(error);
            }
        });
    }
}
function assertSafeProcessInput(input) {
    if (!input.command || input.command.includes("\0")) {
        throw new Error("runner_invalid_command");
    }
    if (!input.cwd || input.cwd.includes("\0")) {
        throw new Error("runner_invalid_cwd");
    }
    if (!Number.isFinite(input.timeoutMs) || input.timeoutMs <= 0) {
        throw new Error("runner_invalid_timeout");
    }
    for (const arg of input.args) {
        if (arg.includes("\0")) {
            throw new Error("runner_invalid_arg");
        }
    }
    for (const key of Object.keys(input.env)) {
        if (isForbiddenRunnerEnvKey(key)) {
            throw new Error(`runner_forbidden_env:${key}`);
        }
    }
}
function isForbiddenRunnerEnvKey(key) {
    return (key === "GITHUB_TOKEN" ||
        key === "GH_TOKEN" ||
        key === "ACTIONS_ID_TOKEN_REQUEST_URL" ||
        key === "ACTIONS_ID_TOKEN_REQUEST_TOKEN" ||
        key === "GITHUB_ENV" ||
        key === "GITHUB_OUTPUT" ||
        key === "GITHUB_PATH" ||
        key === "GITHUB_STEP_SUMMARY" ||
        key === "GITHUB_STATE" ||
        key === "NODE_OPTIONS" ||
        key === "BASH_ENV" ||
        key === "ENV" ||
        key.startsWith("INPUT_AUTH") ||
        key.includes("AUTH_JSON") ||
        key.includes("OPENAI_API_KEY") ||
        key.includes("CLAUDE_CODE_OAUTH_TOKEN") ||
        key.includes("OPENROUTER_API_KEY"));
}
function writeRedacted(sink, redactor, chunk) {
    if (!sink)
        return;
    sink.write(redactor.redact(chunk.toString("utf8")));
}
function appendCapturedChunk(chunks, currentBytes, chunk, maxBytes) {
    const remaining = maxBytes - currentBytes;
    if (remaining <= 0)
        return currentBytes;
    const nextChunk = chunk.byteLength > remaining ? chunk.subarray(0, remaining) : chunk;
    chunks.push(nextChunk);
    return currentBytes + nextChunk.byteLength;
}
function safeFailureOutput(output) {
    const compact = output.replace(/\s+/g, " ").trim();
    return compact ? compact.slice(-1000) : "empty_process_output";
}
//# sourceMappingURL=github-action-runner.js.map