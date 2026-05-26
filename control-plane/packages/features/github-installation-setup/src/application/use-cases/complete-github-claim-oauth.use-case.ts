import {
  createSafeError,
  parseIntegrationConnectionId,
  toSafeError,
  toUnixMilliseconds,
} from "@agent-teams-control-plane/shared";

import type { IntegrationConnectionRepository } from "@agent-teams-control-plane/features-integration-connections";

import type { GitHubCredentialHasher } from "../ports/credential-hasher.port.js";
import type { GitHubSetupIdGenerator } from "../ports/entropy.js";
import type { GitHubClaimAuthorityVerifier } from "../ports/github-claim-authority-verifier.port.js";
import type { GitHubUserTokenExchange } from "../ports/github-oauth.port.js";
import type { GitHubSetupRepository } from "../ports/github-setup.repository.js";
import type { PkceSecretStore } from "../ports/pkce-secret-store.js";
import type {
  GitHubSetupAbuseControlPolicy,
  GitHubSetupAuditLog,
} from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";

export type CompleteGitHubClaimOAuthInput = Readonly<{
  state?: string;
  code?: string;
  providerErrorCode?: string;
  duplicateParameter?: boolean;
}>;

export type CompleteGitHubClaimOAuthResult = Readonly<{
  status: "connected" | "failed";
  connectionId?: string;
  safeErrorCode?: string;
}>;

export class CompleteGitHubClaimOAuthUseCase {
  public constructor(
    private readonly repository: GitHubSetupRepository,
    private readonly integrationConnections: IntegrationConnectionRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly credentialHasher: GitHubCredentialHasher,
    private readonly pkceSecretStore: PkceSecretStore,
    private readonly tokenExchange: GitHubUserTokenExchange,
    private readonly authorityVerifier: GitHubClaimAuthorityVerifier,
    private readonly abuseControlPolicy: GitHubSetupAbuseControlPolicy,
    private readonly auditLog: GitHubSetupAuditLog,
    private readonly idGenerator: GitHubSetupIdGenerator,
  ) {}

  public async execute(
    input: CompleteGitHubClaimOAuthInput,
  ): Promise<CompleteGitHubClaimOAuthResult> {
    await this.abuseControlPolicy.assertAllowed({
      action: "github-oauth-callback",
      key: input.state === undefined ? "missing-state" : "state-present",
    });

    if (input.duplicateParameter === true) {
      const safeError = invalidOAuthCallbackError(
        "CONTROL_PLANE_OAUTH_DUPLICATE_PARAMETER",
      );
      await this.repository.markOAuthFailed({ safeError });
      return { safeErrorCode: safeError.code, status: "failed" };
    }
    if (input.state === undefined) {
      const safeError = invalidOAuthCallbackError("CONTROL_PLANE_OAUTH_STATE_MISSING");
      await this.repository.markOAuthFailed({ safeError });
      return { safeErrorCode: safeError.code, status: "failed" };
    }

    const oauthStateHash = await this.credentialHasher.hash({
      credential: input.state,
      purpose: "github-oauth-state",
    });
    const nowMs = toUnixMilliseconds(Date.now());
    const session = await this.transactionRunner.runInTransaction(async (context) =>
      this.repository.consumeOAuthState(
        {
          nowMs,
          oauthStateHash: oauthStateHash.value,
        },
        context,
      ),
    );
    if (session === undefined) {
      const safeError = invalidOAuthCallbackError("CONTROL_PLANE_OAUTH_STATE_INVALID");
      await this.repository.markOAuthFailed({ safeError });
      return { safeErrorCode: safeError.code, status: "failed" };
    }
    if (input.providerErrorCode !== undefined || input.code === undefined) {
      const safeError = invalidOAuthCallbackError(
        input.providerErrorCode ?? "CONTROL_PLANE_OAUTH_CODE_MISSING",
      );
      const providerErrorCode = normalizeProviderErrorCode(input.providerErrorCode);
      await this.repository.markOAuthFailed({
        oauthSessionId: session.oauthSession.id,
        safeError,
        ...(providerErrorCode === undefined ? {} : { providerErrorCode }),
      });
      return { safeErrorCode: safeError.code, status: "failed" };
    }

    const verification = await this.verifyClaimWithProvider({
      code: input.code,
      session,
    });
    if (verification.kind === "rejected") {
      await this.repository.markOAuthFailed({
        oauthSessionId: session.oauthSession.id,
        safeError: verification.safeError,
      });
      return { safeErrorCode: verification.safeError.code, status: "failed" };
    }

    const connectionId = parseIntegrationConnectionId(this.idGenerator.uuid());
    if (!connectionId.ok) {
      throw connectionId.error;
    }
    const boundConnection = await this.transactionRunner.runInTransaction(
      async (context) => {
        const connection = await this.integrationConnections.bindVerifiedInstallation(
          {
            account: verification.account,
            claimedByDesktopClientId: session.oauthSession.desktopClientId,
            connectionId: connectionId.value,
            githubInstallationId: verification.githubInstallationId,
            nowMs,
            repositories: verification.repositories,
            repositorySyncStatus: verification.repositorySync,
            workspaceId: session.oauthSession.workspaceId,
          },
          context,
        );
        await this.repository.markClaimBound(
          {
            claimId: session.claim.id,
            connectionId: connection.id,
            nowMs,
            setupSessionId: session.claim.setupSessionId,
            verifiedGithubLogin: verification.githubUser.login,
            verifiedGithubUserId: verification.githubUser.id,
          },
          context,
        );
        return connection;
      },
    );
    await this.auditLog.record({
      eventType: "github_installation_bound",
      subjectId: boundConnection.id,
      subjectKind: "integration_connection",
      workspaceId: boundConnection.workspaceId,
      safeMetadata: {
        githubInstallationId: verification.githubInstallationId,
        repositoryCount: verification.repositories.length,
        repositorySyncComplete: verification.repositorySync.complete,
      },
    });

    return {
      connectionId: boundConnection.id,
      status: "connected",
    };
  }

  private async verifyClaimWithProvider(input: {
    code: string;
    session: ConsumedSession;
  }): Promise<ProviderVerification> {
    try {
      const verifier = await this.pkceSecretStore.decryptVerifier(
        input.session.pkceVerifier,
      );
      const token = await this.tokenExchange.exchangeCode({
        code: input.code,
        codeVerifier: verifier,
        redirectUri: input.session.oauthSession.redirectUriSnapshot,
      });
      return await this.authorityVerifier.verifyInstallationClaim({
        githubInstallationId: input.session.claim.githubInstallationId,
        userAccessToken: token.accessToken,
      });
    } catch (error) {
      return {
        kind: "rejected",
        safeError: toSafeError(error),
      };
    }
  }
}

function invalidOAuthCallbackError(code: string) {
  return createSafeError({
    category: "validation",
    code,
    message: "GitHub OAuth callback could not be completed.",
  });
}

type ConsumedSession =
  Awaited<ReturnType<GitHubSetupRepository["consumeOAuthState"]>> extends infer T
    ? Exclude<T, undefined>
    : never;

type ProviderVerification = Awaited<
  ReturnType<GitHubClaimAuthorityVerifier["verifyInstallationClaim"]>
>;

function normalizeProviderErrorCode(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim();
  return /^[A-Za-z0-9_.-]{1,64}$/.test(normalized) ? normalized : "provider_error";
}
