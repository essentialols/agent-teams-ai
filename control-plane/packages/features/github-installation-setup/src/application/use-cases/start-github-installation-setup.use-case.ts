import { toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "@agent-teams-control-plane/features-workspace-identity";

import type { GitHubCredentialHasher } from "../ports/credential-hasher.port.js";
import type {
  GitHubSetupIdGenerator,
  GitHubSetupSecretGenerator,
} from "../ports/entropy.js";
import type { GitHubAppSetupSettings } from "../ports/github-app-settings.js";
import type { GitHubSetupRepository } from "../ports/github-setup.repository.js";
import type {
  GitHubSetupAbuseControlPolicy,
  GitHubSetupAuditLog,
  GitHubSetupFeatureGatePolicy,
} from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";

const setupTtlMs = 15 * 60 * 1000;

export type StartGitHubInstallationSetupResult = Readonly<{
  setupSessionId: string;
  installUrl: string;
  expiresAt: string;
}>;

export class StartGitHubInstallationSetupUseCase {
  public constructor(
    private readonly repository: GitHubSetupRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly credentialHasher: GitHubCredentialHasher,
    private readonly featureGatePolicy: GitHubSetupFeatureGatePolicy,
    private readonly abuseControlPolicy: GitHubSetupAbuseControlPolicy,
    private readonly auditLog: GitHubSetupAuditLog,
    private readonly settings: GitHubAppSetupSettings,
    private readonly idGenerator: GitHubSetupIdGenerator,
    private readonly secretGenerator: GitHubSetupSecretGenerator,
  ) {}

  public async execute(
    actor: DesktopClientActor,
  ): Promise<StartGitHubInstallationSetupResult> {
    await this.featureGatePolicy.assertEnabled("github-setup");
    await this.abuseControlPolicy.assertAllowed({
      action: "github-setup-start",
      actor,
    });
    const { appSlug } = this.settings.requireSetupSettings();
    const nowMs = toUnixMilliseconds(Date.now());
    const expiresAtMs = toUnixMilliseconds(nowMs + setupTtlMs);
    const setupState = this.secretGenerator.secret({ bytes: 32 });
    const setupStateHash = await this.credentialHasher.hash({
      credential: setupState,
      purpose: "github-setup-state",
    });
    const setupSessionId = this.idGenerator.uuid();

    await this.transactionRunner.runInTransaction(async (context) => {
      await this.repository.createSetupSession(
        {
          actor,
          expiresAtMs,
          id: setupSessionId,
          nowMs,
          setupStateHash: setupStateHash.value,
        },
        context,
      );
    });
    await this.auditLog.record({
      actor,
      eventType: "github_setup_started",
      subjectId: setupSessionId,
      subjectKind: "github_setup_session",
      workspaceId: actor.workspaceId,
    });

    return {
      expiresAt: new Date(expiresAtMs).toISOString(),
      installUrl: buildGitHubInstallUrl(appSlug, setupState),
      setupSessionId,
    };
  }
}

function buildGitHubInstallUrl(appSlug: string, setupState: string): string {
  const url = new URL(
    `https://github.com/apps/${encodeURIComponent(appSlug)}/installations/new`,
  );
  url.searchParams.set("state", setupState);
  return url.toString();
}
