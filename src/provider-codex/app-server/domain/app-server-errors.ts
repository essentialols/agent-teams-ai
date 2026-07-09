import { parseCodexStructuredOutput } from "../../structured-output";
import { readRecord } from "./app-server-record";
import {
  defaultControlRequestTimeoutMs,
  defaultMaxOutputBytes,
  defaultStartupTimeoutMs,
  defaultTimeoutMs,
  type AppServerWarning,
} from "./app-server-types";

export function cleanThreadPrewarmWarning(error: unknown): AppServerWarning {
  return {
    code: "codex_app_server_clean_thread_prewarm_failed",
    safeMessage: `Codex app-server clean thread prewarm failed: ${safeMessage(error)}`,
  };
}

export function appServerOutputSchemaNotNativeWarning(): AppServerWarning {
  return {
    code: "codex_app_server_output_schema_not_native",
    safeMessage:
      "Codex app-server used final-text structured output parsing because no native JSON schema was registered.",
  };
}

export function parseStructuredOutput(outputText: string): unknown {
  return parseCodexStructuredOutput(
    outputText,
    "codex_app_server_structured_output_invalid",
  );
}

export function assertOutputWithinBounds(
  output: string,
  maxOutputBytes = defaultMaxOutputBytes,
): void {
  if (Buffer.byteLength(output, "utf8") > maxOutputBytes) {
    throw new Error("codex_app_server_output_too_large");
  }
}

export function controlRequestTimeoutMs(taskTimeoutMs: number): number {
  return Math.min(taskTimeoutMs, defaultControlRequestTimeoutMs);
}

export function appServerStartupTimeoutMs(input: {
  readonly timeoutMs?: number;
  readonly startupTimeoutMs?: number;
}): number {
  return Math.min(
    input.timeoutMs ?? defaultTimeoutMs,
    input.startupTimeoutMs ?? defaultStartupTimeoutMs,
  );
}

export function assertPositiveInteger(
  value: number | undefined,
  code: string,
): void {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value <= 0) throw new Error(code);
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new Error("codex_app_server_aborted");
}

export function isAbortLikeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("codex_app_server_aborted") ||
      error.message.includes("codex_app_server_turn_aborted") ||
      error.message.includes("node_process_runner_aborted"))
  );
}

export function safeMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(-1000);
  if (typeof error === "string") return error.slice(-1000);
  const record = readRecord(error);
  if (typeof record?.message === "string") return record.message.slice(-1000);
  const nested = record ? readRecord(record.error) : null;
  if (typeof nested?.message === "string") return nested.message.slice(-1000);
  return "unknown";
}
