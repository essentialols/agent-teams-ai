import type {
  ProjectIntegrationMcpArgs,
  ProjectIntegrationMcpToolHandlers,
} from "../ports/project-integration-mcp-tool-handlers";
import type {
  CreateProjectIntegrationMcpToolHandlersOptions,
  ProjectIntegrationMcpUseCaseDeps,
} from "./project-integration-mcp-handler-contracts";
import {
  projectIntegrationApplyWorkerOutput,
  projectIntegrationCommitApprovedChanges,
  projectIntegrationOpenAttempt,
  projectIntegrationPushApprovedCommit,
  projectIntegrationRejectAttempt,
  projectIntegrationRunRequiredChecks,
} from "./project-integration-mcp-action-handlers";

export type {
  CreateProjectIntegrationMcpToolHandlersOptions,
  ProjectIntegrationMcpUseCaseDeps,
} from "./project-integration-mcp-handler-contracts";

export function createProjectIntegrationMcpToolHandlers(
  options: CreateProjectIntegrationMcpToolHandlersOptions,
): ProjectIntegrationMcpToolHandlers {
  return {
    openAttempt: (args) =>
      projectIntegrationOpenAttempt(options, args as ProjectIntegrationMcpArgs),
    applyWorkerOutput: (args) =>
      projectIntegrationApplyWorkerOutput(options, args as ProjectIntegrationMcpArgs),
    runRequiredChecks: (args) =>
      projectIntegrationRunRequiredChecks(options, args as ProjectIntegrationMcpArgs),
    commitApprovedChanges: (args) =>
      projectIntegrationCommitApprovedChanges(
        options,
        args as ProjectIntegrationMcpArgs,
      ),
    pushApprovedCommit: (args) =>
      projectIntegrationPushApprovedCommit(options, args as ProjectIntegrationMcpArgs),
    rejectAttempt: (args) =>
      projectIntegrationRejectAttempt(options, args as ProjectIntegrationMcpArgs),
  };
}
