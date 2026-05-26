import type {
  IntegrationTargetId,
  TargetPolicySubjectKind,
} from "@agent-teams-control-plane/features-integration-targets";
import type { UnixMilliseconds, WorkspaceId } from "@agent-teams-control-plane/shared";

export type GitHubTokenTargetAuthorizationInput = Readonly<{
  workspaceId: WorkspaceId;
  targetId: IntegrationTargetId;
  capability: string;
  subjectKind: TargetPolicySubjectKind;
  subjectId: string;
  desktopClientSubjectId?: string;
  teamSubjectId?: string;
  agentSubjectId?: string;
  nowMs: UnixMilliseconds;
}>;

export type GitHubTokenTargetAuthorizationResult = Readonly<{
  allowed: boolean;
  reasonCode: string;
  policyVersion?: number;
  scope?: Readonly<{
    integrationTargetId: IntegrationTargetId;
    workspaceId: WorkspaceId;
    githubInstallationId: string;
    githubRepositoryId: string;
  }>;
}>;

export interface GitHubTokenTargetAuthorizationPort {
  authorize(
    input: GitHubTokenTargetAuthorizationInput,
  ): Promise<GitHubTokenTargetAuthorizationResult>;
}
