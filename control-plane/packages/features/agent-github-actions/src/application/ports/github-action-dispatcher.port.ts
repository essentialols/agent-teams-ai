import type { SafeError } from "@agent-teams-control-plane/shared";

import type { GitHubActionPayload, GitHubActionType } from "../../domain/index.js";
import type { GitHubActionTokenLease } from "./github-installation-token-broker.port.js";

export type GitHubRepositoryDispatchTarget = Readonly<{
  owner: string;
  repo: string;
}>;

export type GitHubActionDispatchSuccess = Readonly<{
  kind: "success";
  githubDeliveryId?: string;
  githubCheckRunId?: string;
  githubUrl?: string;
  githubStatusCode?: number;
  githubRequestId?: string;
}>;

export type GitHubActionDispatchFailure = Readonly<{
  kind: "failure";
  safeError: SafeError;
  retryAfterMs?: number;
  githubStatusCode?: number;
  githubRequestId?: string;
}>;

export type GitHubActionDispatchResult =
  | GitHubActionDispatchSuccess
  | GitHubActionDispatchFailure;

export interface GitHubActionDispatcher {
  dispatch(input: {
    actionType: GitHubActionType;
    payload: GitHubActionPayload;
    renderedBody?: string;
    checkRunId?: string;
    target: GitHubRepositoryDispatchTarget;
    tokenLease: GitHubActionTokenLease;
    actionRequestId: string;
  }): Promise<GitHubActionDispatchResult>;
}
