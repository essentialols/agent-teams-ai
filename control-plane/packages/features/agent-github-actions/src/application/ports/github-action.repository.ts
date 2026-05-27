import type { SafeError, TransactionContext } from "@agent-teams-control-plane/shared";

import type {
  GitHubActionAttemptStatus,
  GitHubActionRequest,
  GitHubActionType,
  TrustedRequestSubjectKind,
} from "../../domain/index.js";

export type GitHubActionDispatchView = Readonly<{
  request: GitHubActionRequest;
  target: Readonly<{
    owner: string;
    repo: string;
    displayFullName: string;
    status: string;
  }>;
}>;

export type CreateGitHubActionRequestInput = Readonly<{
  id: GitHubActionRequest["id"];
  workspaceId: GitHubActionRequest["workspaceId"];
  integrationTargetId: string;
  actionType: GitHubActionType;
  requestedBySubjectKind: TrustedRequestSubjectKind;
  requestedBySubjectId: string;
  assertedByDesktopClientId: GitHubActionRequest["assertedByDesktopClientId"];
  attribution: GitHubActionRequest["attribution"];
  idempotencyKey: string;
  externalContentRefId: GitHubActionRequest["externalContentRefId"];
  externalContentIntegrityHash: string;
}>;

export type CreateGitHubActionRequestResult = Readonly<{
  request: GitHubActionRequest;
  created: boolean;
}>;

export interface GitHubActionRepository {
  findByIdempotency(input: {
    workspaceId: GitHubActionRequest["workspaceId"];
    idempotencyKey: string;
  }): Promise<GitHubActionRequest | undefined>;

  createQueued(
    input: CreateGitHubActionRequestInput,
    context: TransactionContext,
  ): Promise<CreateGitHubActionRequestResult>;

  findStatus(input: {
    workspaceId: GitHubActionRequest["workspaceId"];
    actionRequestId: GitHubActionRequest["id"];
  }): Promise<GitHubActionRequest | undefined>;

  findForDispatch(input: {
    actionRequestId: GitHubActionRequest["id"];
  }): Promise<GitHubActionDispatchView | undefined>;

  recordAttemptStarted(
    input: {
      actionRequestId: GitHubActionRequest["id"];
      attemptNumber: number;
      startedAtMs: number;
    },
    context: TransactionContext,
  ): Promise<void>;

  finishAttempt(
    input: {
      actionRequestId: GitHubActionRequest["id"];
      attemptNumber: number;
      status: GitHubActionAttemptStatus;
      finishedAtMs: number;
      safeError?: SafeError;
      githubStatusCode?: number;
      githubRequestId?: string;
    },
    context: TransactionContext,
  ): Promise<void>;

  markDispatching(
    input: {
      actionRequestId: GitHubActionRequest["id"];
      nowMs: number;
    },
    context: TransactionContext,
  ): Promise<void>;

  markSucceeded(
    input: {
      actionRequestId: GitHubActionRequest["id"];
      nowMs: number;
      githubDeliveryId?: string;
      githubCheckRunId?: string;
      githubUrl?: string;
      contentShredded: boolean;
    },
    context: TransactionContext,
  ): Promise<void>;

  markRetryableFailure(
    input: {
      actionRequestId: GitHubActionRequest["id"];
      nowMs: number;
      safeError: SafeError;
    },
    context: TransactionContext,
  ): Promise<void>;

  markTerminalFailure(
    input: {
      actionRequestId: GitHubActionRequest["id"];
      nowMs: number;
      status: "failed" | "dead_lettered";
      safeError: SafeError;
      contentShredded: boolean;
    },
    context: TransactionContext,
  ): Promise<void>;
}
