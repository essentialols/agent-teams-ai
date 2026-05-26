import { toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { GitHubCredentialHasher } from "../ports/credential-hasher.port.js";
import type {
  GitHubSetupIdGenerator,
  GitHubSetupSecretGenerator,
} from "../ports/entropy.js";
import type {
  GitHubSetupRepository,
  SetupCallbackResult,
} from "../ports/github-setup.repository.js";
import type {
  GitHubSetupAbuseControlPolicy,
  GitHubSetupAuditLog,
  GitHubSetupFeatureGatePolicy,
} from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";

export type GitHubSetupCallbackInput = Readonly<{
  state?: string;
  installationId?: string;
}>;

export class HandleGitHubSetupCallbackUseCase {
  public constructor(
    private readonly repository: GitHubSetupRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly credentialHasher: GitHubCredentialHasher,
    private readonly featureGatePolicy: GitHubSetupFeatureGatePolicy,
    private readonly abuseControlPolicy: GitHubSetupAbuseControlPolicy,
    private readonly auditLog: GitHubSetupAuditLog,
    private readonly idGenerator: GitHubSetupIdGenerator,
    private readonly secretGenerator: GitHubSetupSecretGenerator,
  ) {}

  public async execute(input: GitHubSetupCallbackInput): Promise<SetupCallbackResult> {
    await this.featureGatePolicy.assertEnabled("github-setup");
    await this.abuseControlPolicy.assertAllowed({
      action: "github-setup-callback",
      key: input.state === undefined ? "missing-state" : "state-present",
    });

    const nowMs = toUnixMilliseconds(Date.now());
    const setupStateHash =
      input.state === undefined
        ? undefined
        : (
            await this.credentialHasher.hash({
              credential: input.state,
              purpose: "github-setup-state",
            })
          ).value;
    const claimContinuationToken = this.secretGenerator.secret({ bytes: 32 });
    const claimContinuationHash = await this.credentialHasher.hash({
      credential: claimContinuationToken,
      purpose: "github-claim-continuation",
    });

    const result = await this.transactionRunner.runInTransaction(async (context) =>
      this.repository.handleSetupCallback(
        {
          claimContinuationToken,
          claimContinuationTokenHash: claimContinuationHash.value,
          claimId: this.idGenerator.uuid(),
          nowMs,
          ...(input.installationId === undefined
            ? {}
            : { githubInstallationId: input.installationId }),
          ...(setupStateHash === undefined ? {} : { setupStateHash }),
        },
        context,
      ),
    );
    if (result.kind === "untrusted-callback") {
      if (this.featureGatePolicy.isEnabled("github-unclaimed-callback-recording")) {
        await this.repository.recordUnclaimedCallback({
          nowMs,
          setupStatePresent: input.state !== undefined,
          ...(input.installationId === undefined
            ? {}
            : { githubInstallationId: input.installationId }),
        });
      }
      await this.auditLog.record({
        eventType: "github_setup_unclaimed_callback_received",
        safeMetadata: {
          githubInstallationId: input.installationId ?? null,
          setupStatePresent: input.state !== undefined,
        },
      });
      return result;
    }

    await this.auditLog.record({
      eventType: "github_setup_callback_received",
      subjectId: result.setupSessionId,
      subjectKind: "github_setup_session",
      safeMetadata: {
        claimId: result.claimId,
        githubInstallationId: input.installationId ?? null,
      },
    });
    return result;
  }
}
