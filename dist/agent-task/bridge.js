import { pathToFileURL } from "node:url";
import { parseAgentTaskEvent, parseAgentTaskRequest, parseAgentTaskResult, providerTaskEventToAgentTaskEvent, providerTaskResultToAgentTaskResult, } from "./codec.js";
import { agentTaskProtocolVersion, AgentTaskProtocolError, makeAgentTaskFailure, } from "./types.js";
export async function runAgentTaskBridge(requestValue, handler, options = {}) {
    const request = parseAgentTaskRequest(requestValue);
    const normalizedHandler = normalizeHandler(handler);
    const events = [];
    let startedEmitted = false;
    let terminalFromEmit = null;
    const emit = async (event) => {
        const normalized = normalizeEvent(event);
        if (normalized.type === "started")
            startedEmitted = true;
        if (normalized.type === "completed")
            terminalFromEmit = normalized.result;
        events.push(normalized);
        await options.onEvent?.(normalized);
    };
    const emitStarted = async (occurredAt = nowIso(options)) => {
        if (startedEmitted)
            return;
        await emit({
            protocolVersion: agentTaskProtocolVersion,
            type: "started",
            occurredAt,
        });
    };
    const context = createContext({ ...options, emit });
    try {
        if (normalizedHandler.streamTask) {
            let yieldedTerminal = null;
            for await (const event of normalizedHandler.streamTask(request, context)) {
                const normalized = normalizeEvent(event);
                if (normalized.type === "started" && startedEmitted)
                    continue;
                if (normalized.type === "started") {
                    await emit(normalized);
                    continue;
                }
                await emitStarted(normalized.occurredAt);
                await emit(normalized);
                if (normalized.type === "completed")
                    yieldedTerminal = normalized.result;
            }
            const terminal = yieldedTerminal ?? terminalFromEmit;
            if (terminal)
                return { request, result: terminal, events };
            await emitStarted();
            const result = makeBridgeFailure("provider_output_invalid", "Stream ended without a completed event.");
            await emit({
                protocolVersion: agentTaskProtocolVersion,
                type: "completed",
                occurredAt: nowIso(options),
                result,
            });
            return {
                request,
                result,
                events,
            };
        }
        await emitStarted();
        if (!normalizedHandler.runTask) {
            return {
                request,
                result: makeBridgeFailure("provider_output_invalid", "Agent task handler has no runTask implementation."),
                events,
            };
        }
        const result = normalizeResult(await normalizedHandler.runTask(request, context));
        await emit({
            protocolVersion: agentTaskProtocolVersion,
            type: "completed",
            occurredAt: nowIso(options),
            result,
        });
        return { request, result, events };
    }
    catch (error) {
        await emitStarted();
        const result = makeBridgeFailure(error instanceof AgentTaskProtocolError
            ? "provider_output_invalid"
            : "unknown_runtime_failure", error instanceof Error ? error.message : "Agent task handler failed.");
        await emit({
            protocolVersion: agentTaskProtocolVersion,
            type: "completed",
            occurredAt: nowIso(options),
            result,
        });
        return { request, result, events };
    }
}
export async function* streamAgentTaskBridge(requestValue, handler, options = {}) {
    const queued = [];
    let done = false;
    let failed;
    let wake = null;
    const notify = () => {
        wake?.();
        wake = null;
    };
    const run = runAgentTaskBridge(requestValue, handler, {
        ...options,
        onEvent: (event) => {
            queued.push(event);
            notify();
        },
    }).then(() => {
        done = true;
        notify();
    }, (error) => {
        failed = error;
        done = true;
        notify();
    });
    while (!done || queued.length > 0) {
        if (queued.length === 0) {
            await new Promise((resolve) => {
                wake = resolve;
            });
            continue;
        }
        yield queued.shift();
    }
    await run;
    if (failed !== undefined) {
        throw failed;
    }
}
export async function loadAgentTaskHandler(specifier, input) {
    const module = await import(resolveImportSpecifier(specifier, input?.cwd));
    const candidate = module.runAgentTask ??
        module.handler ??
        module.default ??
        module.runTask ??
        module.streamTask;
    if (typeof candidate === "function")
        return candidate;
    if (candidate && typeof candidate === "object") {
        const maybeHandler = candidate;
        if (typeof maybeHandler.runTask === "function" ||
            typeof maybeHandler.streamTask === "function") {
            return maybeHandler;
        }
    }
    if (typeof module.runTask === "function" ||
        typeof module.streamTask === "function") {
        return {
            ...(typeof module.runTask === "function"
                ? { runTask: module.runTask }
                : {}),
            ...(typeof module.streamTask === "function"
                ? { streamTask: module.streamTask }
                : {}),
        };
    }
    throw new AgentTaskProtocolError("agent_task_handler_invalid", "Handler module must export runAgentTask, handler, default, runTask, or streamTask.");
}
function normalizeHandler(handler) {
    if (typeof handler === "function")
        return { runTask: handler };
    if (typeof handler.runTask === "function" ||
        typeof handler.streamTask === "function") {
        return handler;
    }
    throw new AgentTaskProtocolError("agent_task_handler_invalid", "Agent task handler must be a function or an object with runTask/streamTask.");
}
function createContext(input) {
    return {
        abortSignal: input.abortSignal ?? new AbortController().signal,
        emit: input.emit,
    };
}
function normalizeResult(value) {
    if (isAgentTaskResultLike(value))
        return parseAgentTaskResult(value);
    return providerTaskResultToAgentTaskResult(value);
}
function normalizeEvent(value) {
    if (isAgentTaskEventLike(value))
        return parseAgentTaskEvent(value);
    return providerTaskEventToAgentTaskEvent(value);
}
function isAgentTaskResultLike(value) {
    return hasProtocolVersion(value) && hasStringProperty(value, "status");
}
function isAgentTaskEventLike(value) {
    return hasProtocolVersion(value) && hasStringProperty(value, "type");
}
function hasProtocolVersion(value) {
    return (typeof value === "object" &&
        value !== null &&
        "protocolVersion" in value);
}
function hasStringProperty(value, key) {
    return (typeof value === "object" &&
        value !== null &&
        typeof value[key] === "string");
}
function makeBridgeFailure(code, safeMessage) {
    return {
        protocolVersion: agentTaskProtocolVersion,
        status: "failed",
        failure: makeAgentTaskFailure(code, safeMessage),
        warnings: [],
    };
}
function nowIso(options) {
    return (options.now?.() ?? new Date()).toISOString();
}
function resolveImportSpecifier(specifier, cwd = process.cwd()) {
    if (specifier.startsWith("file:") ||
        specifier.startsWith("node:") ||
        specifier.startsWith("data:") ||
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(specifier)) {
        return specifier;
    }
    if (specifier.startsWith(".") || specifier.startsWith("/")) {
        const path = specifier.startsWith("/")
            ? specifier
            : new URL(specifier, pathToFileURL(`${cwd}/`)).pathname;
        return pathToFileURL(path).href;
    }
    return specifier;
}
//# sourceMappingURL=bridge.js.map