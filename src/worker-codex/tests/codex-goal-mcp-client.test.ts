import { describe, expect, it } from "vitest";
import {
  ControllerSupervisorObservedStatus,
  controllerSupervisorHasAvailableAccounts,
  controllerSupervisorObservedStatus,
  controllerSupervisorStatusIsTerminal,
  controllerSupervisorTerminalStatusCanRetry,
} from "../codex-goal-mcp-client";

describe("codex goal MCP client supervisor helpers", () => {
  it("reads nested provider status before persisted run status", () => {
    expect(controllerSupervisorObservedStatus({
      ok: true,
      mode: "project_controller_status",
      run: { status: "running" },
      providerObserved: { status: "completed" },
      liveController: { providerObservedStatus: "completed" },
    })).toBe(ControllerSupervisorObservedStatus.Completed);
  });

  it("falls back through live controller, run, session and top-level status", () => {
    expect(controllerSupervisorObservedStatus({
      liveController: { providerObservedStatus: "blocked" },
      run: { status: "running" },
    })).toBe(ControllerSupervisorObservedStatus.Blocked);
    expect(controllerSupervisorObservedStatus({
      run: { status: "failed" },
      session: { status: "running" },
    })).toBe(ControllerSupervisorObservedStatus.Failed);
    expect(controllerSupervisorObservedStatus({
      session: { status: "stale" },
    })).toBe(ControllerSupervisorObservedStatus.Stale);
    expect(controllerSupervisorObservedStatus({
      status: "running",
    })).toBe(ControllerSupervisorObservedStatus.Running);
  });

  it("treats only planned and running as non-terminal", () => {
    expect(controllerSupervisorStatusIsTerminal(
      ControllerSupervisorObservedStatus.Planned,
    )).toBe(false);
    expect(controllerSupervisorStatusIsTerminal(
      ControllerSupervisorObservedStatus.Running,
    )).toBe(false);
    expect(controllerSupervisorStatusIsTerminal(
      ControllerSupervisorObservedStatus.Completed,
    )).toBe(true);
    expect(controllerSupervisorStatusIsTerminal(
      ControllerSupervisorObservedStatus.Failed,
    )).toBe(true);
  });

  it("retries failed project controllers only after quota failures", () => {
    expect(controllerSupervisorTerminalStatusCanRetry(
      ControllerSupervisorObservedStatus.Failed,
      { ok: true, run: { safeMessage: "Codex quota or billing limit was reached." } },
    )).toBe(true);
    expect(controllerSupervisorTerminalStatusCanRetry(
      ControllerSupervisorObservedStatus.Failed,
      { ok: true, run: { safeMessage: "Codex session is invalid." } },
    )).toBe(false);
    expect(controllerSupervisorTerminalStatusCanRetry(
      ControllerSupervisorObservedStatus.Blocked,
      { ok: true, run: { safeMessage: "Codex quota or billing limit was reached." } },
    )).toBe(false);
  });

  it("continues only while project accounts remain available", () => {
    expect(controllerSupervisorHasAvailableAccounts({
      ok: true,
      summary: { availableDeduped: 1 },
    })).toBe(true);
    expect(controllerSupervisorHasAvailableAccounts({
      ok: true,
      summary: { availableDeduped: 0 },
    })).toBe(false);
    expect(controllerSupervisorHasAvailableAccounts({ ok: false })).toBe(false);
  });
});
