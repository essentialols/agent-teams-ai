import { describe, expect, it } from "vitest";
import { CodexAppServerExecutionEngine } from "../../codex-app-server-execution-engine";

describe("Codex app-server execution engine options", () => {
  it("rejects invalid startup timeout options", () => {
    expect(() =>
      new CodexAppServerExecutionEngine({
        codexBinaryPath: "/bin/codex-test",
        timeoutMs: 0,
      })
    ).toThrow("codex_app_server_timeout_invalid");
    expect(() =>
      new CodexAppServerExecutionEngine({
        codexBinaryPath: "/bin/codex-test",
        startupTimeoutMs: 0,
      })
    ).toThrow("codex_app_server_startup_timeout_invalid");
    expect(() =>
      new CodexAppServerExecutionEngine({
        codexBinaryPath: "/bin/codex-test",
        startupTimeoutMs: 1.5,
      })
    ).toThrow("codex_app_server_startup_timeout_invalid");
  });
});
