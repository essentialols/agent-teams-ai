import type {
  DesktopClientId,
  IntegrationConnectionId,
  UnixMilliseconds,
  WorkspaceId,
} from "@agent-teams-control-plane/shared";

export type GitHubSetupSessionStatus =
  | "install_url_created"
  | "installation_callback_received"
  | "pending_claim"
  | "connected"
  | "failed"
  | "expired"
  | "cancelled";

export type GitHubInstallationClaimStatus =
  | "pending"
  | "verified"
  | "bound"
  | "failed"
  | "expired";

export type GitHubOAuthClaimSessionStatus =
  | "created"
  | "redirected"
  | "callback_received"
  | "verifying"
  | "verified"
  | "failed"
  | "expired"
  | "cancelled";

export type GitHubSetupSession = Readonly<{
  id: string;
  workspaceId: WorkspaceId;
  desktopClientId: DesktopClientId;
  status: GitHubSetupSessionStatus;
  githubInstallationId?: string;
  expiresAtMs: UnixMilliseconds;
  consumedAtMs?: UnixMilliseconds;
  createdAtMs: UnixMilliseconds;
  updatedAtMs: UnixMilliseconds;
  failureSafeErrorCode?: string;
}>;

export type GitHubInstallationClaim = Readonly<{
  id: string;
  workspaceId: WorkspaceId;
  setupSessionId: string;
  githubInstallationId: string;
  status: GitHubInstallationClaimStatus;
  claimAuthorityKind: "github_user_oauth";
  verifiedGithubUserId?: string;
  verifiedGithubLoginSnapshot?: string;
  verifiedAtMs?: UnixMilliseconds;
}>;

export type GitHubOAuthClaimSession = Readonly<{
  id: string;
  workspaceId: WorkspaceId;
  desktopClientId: DesktopClientId;
  githubInstallationClaimId: string;
  redirectUriSnapshot: string;
  status: GitHubOAuthClaimSessionStatus;
  expiresAtMs: UnixMilliseconds;
  consumedAtMs?: UnixMilliseconds;
}>;

export type GitHubSetupStatus = Readonly<{
  setupSessionId: string;
  status: GitHubSetupSessionStatus;
  expiresAt: string;
  githubInstallationId?: string;
  claimId?: string;
  connectionId?: IntegrationConnectionId;
  safeFailureCode?: string;
}>;
