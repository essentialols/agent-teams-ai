import type {
  AgentActionId,
  ExternalActionContentId,
  TransactionContext,
  WorkspaceId,
} from "@agent-teams-control-plane/shared";

export const GITHUB_ACTION_DISPATCH_EVENT_TYPE = "github.action.dispatch";
export const GITHUB_ACTION_DISPATCH_EVENT_VERSION = 1;

export interface GitHubActionOutbox {
  enqueueDispatch(input: {
    actionRequestId: AgentActionId;
    workspaceId: WorkspaceId;
    contentRefId: ExternalActionContentId;
    contentIntegrityHash: string;
    maxAttempts: number;
    nextAttemptAtMs: number;
    context: TransactionContext;
  }): Promise<void>;
}
