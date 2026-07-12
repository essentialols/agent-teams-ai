import { describe, expect, it } from "vitest";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ProjectIntegrationMcpController } from "../project-integration-mcp";
import { projectIntegrationPushApprovedCommitWithConsumedLedger } from "../codex-goal-mcp-project-integration-ledger";

describe("codex goal MCP project integration ledger preflight", () => {
  it("delegates only after exactly one project-scoped ledger is configured", async () => {
    const response = mcpJson({ ok: true });
    let pushed = false;
    await expect(projectIntegrationPushApprovedCommitWithConsumedLedger({
      args: { attemptId: "attempt-1", confirmPush: true },
      loadController: async () => controller(["/project/ledger"]),
      pushApprovedCommitHandler: async () => {
        pushed = true;
        return response;
      },
    })).resolves.toBe(response);
    expect(pushed).toBe(true);
  });

  it("fails before push when the controller has no consumed ledger", async () => {
    let pushed = false;
    await expect(projectIntegrationPushApprovedCommitWithConsumedLedger({
      args: { attemptId: "attempt-1", confirmPush: true },
      loadController: async () => controller([]),
      pushApprovedCommitHandler: async () => {
        pushed = true;
        return mcpJson({ ok: true });
      },
    })).rejects.toThrow("project_integration_consumed_output_ledger_required");
    expect(pushed).toBe(false);
  });
});

function controller(ledgerRoots: readonly string[]): ProjectIntegrationMcpController {
  return {
    registryRootDir: "/project/registry",
    controller: { jobId: "controller-1", jobRootDir: "/project/controller-1" },
    scope: {
      projectId: "project-1",
      workspaceRoots: ["/project/target"],
      consumedOutputLedgerRoots: ledgerRoots,
    },
  };
}

function mcpJson(value: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value,
  };
}
