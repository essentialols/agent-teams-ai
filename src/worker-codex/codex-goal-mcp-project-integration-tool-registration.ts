import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withMcpErrors } from "./codex-goal-mcp-response";
import {
  loadProjectControlController,
} from "./codex-goal-mcp-project-control-deps";
import {
  projectControlPathArg,
} from "./codex-goal-mcp-project-scope";
import {
  projectIntegrationPushApprovedCommitWithConsumedLedger,
} from "./codex-goal-mcp-project-integration-ledger";
import {
  registerProjectIntegrationMcpTools,
} from "./project-integration-mcp";
import {
  createLocalProjectIntegrationMcpToolHandlers,
} from "./project-integration-mcp/adapters/local-project-integration-mcp-tool-handlers";

export function registerCodexGoalProjectIntegrationTools(server: McpServer): void {
  const projectIntegrationHandlers = createLocalProjectIntegrationMcpToolHandlers({
    loadController: loadProjectControlController,
    resolvePathArg: projectControlPathArg,
  });
  registerProjectIntegrationMcpTools(server, {
    openAttempt: (args) => withMcpErrors(async () =>
      projectIntegrationHandlers.openAttempt(args),
    ),
    applyWorkerOutput: (args) => withMcpErrors(async () =>
      projectIntegrationHandlers.applyWorkerOutput(args),
    ),
    runRequiredChecks: (args) => withMcpErrors(async () =>
      projectIntegrationHandlers.runRequiredChecks(args),
    ),
    commitApprovedChanges: (args) => withMcpErrors(async () =>
      projectIntegrationHandlers.commitApprovedChanges(args),
    ),
    pushApprovedCommit: (args) => withMcpErrors(async () =>
      projectIntegrationPushApprovedCommitWithConsumedLedger({
        args,
        loadController: loadProjectControlController,
        pushApprovedCommitHandler: projectIntegrationHandlers.pushApprovedCommit,
      }),
    ),
    rejectAttempt: (args) => withMcpErrors(async () =>
      projectIntegrationHandlers.rejectAttempt(args),
    ),
  });
}
