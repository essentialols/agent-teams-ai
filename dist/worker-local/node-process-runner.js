import { spawn } from "node:child_process";
export class NodeProcessRunner {
    options;
    runnerId = "node-process-runner";
    capabilities = {
        runnerId: this.runnerId,
        supportsEnvAllowlist: true,
        supportsWorkingDirectory: true,
        supportsTimeout: true,
        supportsAbortSignal: true,
        supportsOutputRedaction: false,
        supportsReadOnlySandbox: false,
        readOnlyFilesystem: false,
        platform: "node-process",
    };
    constructor(options = {}) {
        this.options = options;
    }
    async run(input) {
        if (input.abortSignal.aborted) {
            throw new Error("node_process_runner_aborted");
        }
        const startedAt = Date.now();
        const child = spawn(input.command, [...input.args], {
            cwd: input.cwd,
            env: input.env,
            stdio: ["pipe", "pipe", "pipe"],
        });
        const stdout = [];
        const stderr = [];
        let forceKillTimer = null;
        let abortError = null;
        let childError = null;
        let outputSinkError = null;
        let stdinError = null;
        let timedOut = false;
        let terminalReason = null;
        const terminate = () => {
            if (child.exitCode !== null || child.signalCode !== null)
                return;
            child.kill("SIGTERM");
            forceKillTimer ??= setTimeout(() => {
                if (child.exitCode === null && child.signalCode === null) {
                    child.kill("SIGKILL");
                }
            }, this.options.killGraceMs ?? 5_000);
        };
        const writeOutputSink = (streamName, sink, chunk) => {
            if (!sink || outputSinkError)
                return;
            try {
                sink.write(chunk);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (!terminalReason) {
                    terminalReason = "outputSink";
                    outputSinkError = new Error(`node_process_runner_output_sink_failed:${streamName}:${message}`);
                }
                terminate();
            }
        };
        child.stdout.on("data", (chunk) => {
            stdout.push(chunk);
            writeOutputSink("stdout", input.stdout, chunk);
        });
        child.stderr.on("data", (chunk) => {
            stderr.push(chunk);
            writeOutputSink("stderr", input.stderr, chunk);
        });
        const timeout = setTimeout(() => {
            if (!terminalReason) {
                terminalReason = "timeout";
                timedOut = true;
            }
            terminate();
        }, input.timeoutMs);
        const abort = () => {
            if (!terminalReason) {
                terminalReason = "abort";
                abortError = new Error("node_process_runner_aborted");
            }
            terminate();
        };
        input.abortSignal.addEventListener("abort", abort, { once: true });
        try {
            const exit = await new Promise((resolve) => {
                const failChild = (error) => {
                    if (!terminalReason) {
                        terminalReason = "child";
                        childError = error instanceof Error ? error : new Error(String(error));
                    }
                    terminate();
                };
                const failStdin = (error) => {
                    if (!terminalReason) {
                        terminalReason = "stdin";
                        stdinError = error instanceof Error ? error : new Error(String(error));
                    }
                    terminate();
                };
                child.on("error", failChild);
                child.stdin.on("error", failStdin);
                child.on("close", (code) => resolve({ exitCode: code ?? 1 }));
                try {
                    if (input.stdin) {
                        child.stdin.end(input.stdin);
                    }
                    else {
                        child.stdin.end();
                    }
                }
                catch (error) {
                    failStdin(error);
                }
            });
            if (terminalReason === "abort" && abortError)
                throw abortError;
            if (terminalReason === "timeout" && timedOut) {
                throw new Error(`node_process_runner_timeout:${input.timeoutMs}`);
            }
            if (terminalReason === "child" && childError)
                throw childError;
            if (terminalReason === "outputSink" && outputSinkError) {
                throw outputSinkError;
            }
            const result = {
                exitCode: exit.exitCode,
                stdout: Buffer.concat(stdout).toString("utf8"),
                stderr: Buffer.concat(stderr).toString("utf8"),
                durationMs: Date.now() - startedAt,
            };
            const failureOutput = safeFailureOutput(`${result.stdout}\n${result.stderr}`);
            if (terminalReason === "stdin" &&
                stdinError &&
                failureOutput === "empty_process_output") {
                throw stdinError;
            }
            if (exit.exitCode !== 0) {
                throw Object.assign(new Error(`node_process_runner_failed:${exit.exitCode}:${failureOutput}`), {
                    exitCode: exit.exitCode,
                    stdout: result.stdout,
                    stderr: result.stderr,
                });
            }
            if (terminalReason === "stdin" && stdinError)
                throw stdinError;
            return result;
        }
        finally {
            clearTimeout(timeout);
            if (forceKillTimer)
                clearTimeout(forceKillTimer);
            input.abortSignal.removeEventListener("abort", abort);
        }
    }
}
function safeFailureOutput(output) {
    const compact = output.replace(/\s+/g, " ").trim();
    return compact ? compact.slice(-1000) : "empty_process_output";
}
//# sourceMappingURL=node-process-runner.js.map