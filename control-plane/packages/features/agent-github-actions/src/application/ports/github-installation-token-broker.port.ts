import type { TrustedRequestSubjectKind } from "../../domain/index.js";

export type GitHubActionTokenLease = Readonly<{
  token: string;
  expiresAtMs: number;
  githubInstallationId: string;
}>;

export interface GitHubInstallationTokenBrokerPort {
  issue(input: {
    workspaceId: string;
    targetId: string;
    capability: string;
    subjectKind: TrustedRequestSubjectKind;
    subjectId: string;
    desktopClientSubjectId?: string;
    teamSubjectId?: string;
    agentSubjectId?: string;
    correlationId?: string;
  }): Promise<GitHubActionTokenLease>;
}
