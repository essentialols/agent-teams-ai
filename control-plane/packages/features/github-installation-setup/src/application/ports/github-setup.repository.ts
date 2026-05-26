import type {
  IntegrationConnectionId,
  SafeError,
  UnixMilliseconds,
} from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "@agent-teams-control-plane/features-workspace-identity";

import type {
  GitHubInstallationClaim,
  GitHubOAuthClaimSession,
  GitHubSetupStatus,
} from "../../domain/github-installation-setup.js";
import type { StoredPkceVerifier } from "./pkce-secret-store.js";
import type { TransactionContext } from "./transaction-runner.js";

export type SetupCallbackResult =
  | Readonly<{
      kind: "pending-claim";
      setupSessionId: string;
      claimId: string;
      claimContinuationToken: string;
    }>
  | Readonly<{
      kind: "untrusted-callback";
    }>;

export type OAuthSessionWithClaim = Readonly<{
  oauthSession: GitHubOAuthClaimSession;
  claim: GitHubInstallationClaim;
  pkceVerifier: StoredPkceVerifier;
}>;

export interface GitHubSetupRepository {
  createSetupSession(
    input: {
      id: string;
      actor: DesktopClientActor;
      setupStateHash: string;
      expiresAtMs: UnixMilliseconds;
      nowMs: UnixMilliseconds;
    },
    context: TransactionContext,
  ): Promise<void>;
  handleSetupCallback(
    input: {
      setupStateHash?: string;
      githubInstallationId?: string;
      claimId: string;
      claimContinuationTokenHash: string;
      nowMs: UnixMilliseconds;
      claimContinuationToken: string;
    },
    context: TransactionContext,
  ): Promise<SetupCallbackResult>;
  recordUnclaimedCallback(input: {
    githubInstallationId?: string;
    setupStatePresent: boolean;
    nowMs: UnixMilliseconds;
  }): Promise<void>;
  createOAuthSession(
    input: {
      id: string;
      claimId: string;
      claimContinuationTokenHash: string;
      oauthStateHash: string;
      pkceVerifier: StoredPkceVerifier;
      redirectUri: string;
      expiresAtMs: UnixMilliseconds;
      nowMs: UnixMilliseconds;
    },
    context: TransactionContext,
  ): Promise<GitHubOAuthClaimSession>;
  consumeOAuthState(
    input: {
      oauthStateHash: string;
      nowMs: UnixMilliseconds;
    },
    context: TransactionContext,
  ): Promise<OAuthSessionWithClaim | undefined>;
  markOAuthFailed(input: {
    oauthSessionId?: string;
    providerErrorCode?: string;
    safeError: SafeError;
  }): Promise<void>;
  markClaimFailed(input: { claimId: string; safeError: SafeError }): Promise<void>;
  markClaimBound(
    input: {
      claimId: string;
      setupSessionId: string;
      connectionId: IntegrationConnectionId;
      verifiedGithubUserId: string;
      verifiedGithubLogin: string;
      nowMs: UnixMilliseconds;
    },
    context: TransactionContext,
  ): Promise<void>;
  getSetupStatus(input: {
    actor: DesktopClientActor;
    setupSessionId: string;
  }): Promise<GitHubSetupStatus | undefined>;
}
