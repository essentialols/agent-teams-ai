import { createSafeError, toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { GitHubCredentialHasher } from "../ports/credential-hasher.port.js";
import type {
  GitHubSetupIdGenerator,
  GitHubSetupSecretGenerator,
} from "../ports/entropy.js";
import type { GitHubAppSetupSettings } from "../ports/github-app-settings.js";
import type { GitHubSetupRepository } from "../ports/github-setup.repository.js";
import type { PkceSecretStore } from "../ports/pkce-secret-store.js";
import type {
  GitHubSetupAbuseControlPolicy,
  GitHubSetupAuditLog,
  GitHubSetupFeatureGatePolicy,
} from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";
import { createPkceChallenge } from "./pkce.js";

const oauthTtlMs = 10 * 60 * 1000;

export type StartGitHubClaimOAuthInput = Readonly<{
  claimId: string;
  claimContinuationToken?: string;
}>;

export type StartGitHubClaimOAuthResult = Readonly<{
  authorizationUrl: string;
  expiresAt: string;
}>;

export class StartGitHubClaimOAuthUseCase {
  public constructor(
    private readonly repository: GitHubSetupRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly credentialHasher: GitHubCredentialHasher,
    private readonly pkceSecretStore: PkceSecretStore,
    private readonly featureGatePolicy: GitHubSetupFeatureGatePolicy,
    private readonly abuseControlPolicy: GitHubSetupAbuseControlPolicy,
    private readonly auditLog: GitHubSetupAuditLog,
    private readonly settings: GitHubAppSetupSettings,
    private readonly idGenerator: GitHubSetupIdGenerator,
    private readonly secretGenerator: GitHubSetupSecretGenerator,
  ) {}

  public async execute(
    input: StartGitHubClaimOAuthInput,
  ): Promise<StartGitHubClaimOAuthResult> {
    await this.featureGatePolicy.assertEnabled("github-claim-oauth");
    if (input.claimContinuationToken === undefined) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_CLAIM_CONTINUATION_REQUIRED",
        message: "Claim continuation token is required.",
      });
    }
    await this.abuseControlPolicy.assertAllowed({
      action: "github-claim-start",
      key: input.claimId,
    });

    const oauthSettings = this.settings.requireOAuthSettings();
    const redirectUri = `${oauthSettings.publicBaseUrl}/api/public/github/oauth/callback`;
    const oauthState = this.secretGenerator.secret({ bytes: 32 });
    const oauthStateHash = await this.credentialHasher.hash({
      credential: oauthState,
      purpose: "github-oauth-state",
    });
    const continuationHash = await this.credentialHasher.hash({
      credential: input.claimContinuationToken,
      purpose: "github-claim-continuation",
    });
    const verifier = this.secretGenerator.secret({ bytes: 32 });
    const challenge = createPkceChallenge(verifier);
    const encryptedVerifier = await this.pkceSecretStore.encryptVerifier(verifier);
    const nowMs = toUnixMilliseconds(Date.now());
    const expiresAtMs = toUnixMilliseconds(nowMs + oauthTtlMs);

    const oauthSession = await this.transactionRunner.runInTransaction(async (context) =>
      this.repository.createOAuthSession(
        {
          claimContinuationTokenHash: continuationHash.value,
          claimId: input.claimId,
          expiresAtMs,
          id: this.idGenerator.uuid(),
          nowMs,
          oauthStateHash: oauthStateHash.value,
          pkceVerifier: encryptedVerifier,
          redirectUri,
        },
        context,
      ),
    );
    await this.auditLog.record({
      eventType: "github_claim_oauth_started",
      subjectId: input.claimId,
      subjectKind: "github_installation_claim",
      workspaceId: oauthSession.workspaceId,
    });

    return {
      authorizationUrl: buildOAuthAuthorizeUrl({
        challenge,
        clientId: oauthSettings.clientId,
        redirectUri,
        state: oauthState,
      }),
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }
}

function buildOAuthAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
}): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}
