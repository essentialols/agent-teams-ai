import type {
  ProviderAccountSnapshot,
  ProviderRepositoryAvailability,
  RepositorySyncStatus,
} from "@agent-teams-control-plane/features-integration-connections";
import type { SafeError } from "@agent-teams-control-plane/shared";

export type GitHubInstallationClaimVerification =
  | Readonly<{
      kind: "verified";
      githubInstallationId: string;
      githubUser: Readonly<{
        id: string;
        login: string;
      }>;
      account: ProviderAccountSnapshot;
      repositories: readonly ProviderRepositoryAvailability[];
      repositorySync: RepositorySyncStatus;
    }>
  | Readonly<{
      kind: "rejected";
      safeError: SafeError;
    }>;

export interface GitHubClaimAuthorityVerifier {
  verifyInstallationClaim(input: {
    userAccessToken: string;
    githubInstallationId: string;
  }): Promise<GitHubInstallationClaimVerification>;
}
