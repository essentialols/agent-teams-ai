import { toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "../../domain/workspace-identity.js";
import type { CredentialHasher } from "../ports/credential-hasher.port.js";
import type {
  WorkspaceIdentityIdGenerator,
  WorkspaceIdentitySecretGenerator,
} from "../ports/entropy.js";
import type {
  WorkspaceIdentityAbuseControlPolicy,
  WorkspaceIdentityAuditLog,
  WorkspaceIdentityFeatureGatePolicy,
} from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";
import type { WorkspaceIdentityRepository } from "../ports/workspace-identity.repository.js";

const pairingTtlMs = 10 * 60 * 1000;
const maxAttempts = 5;

export type StartDesktopPairingResult = Readonly<{
  pairingSessionId: string;
  pairingCode: string;
  expiresAt: string;
}>;

export class StartDesktopPairingUseCase {
  public constructor(
    private readonly repository: WorkspaceIdentityRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly credentialHasher: CredentialHasher,
    private readonly featureGatePolicy: WorkspaceIdentityFeatureGatePolicy,
    private readonly abuseControlPolicy: WorkspaceIdentityAbuseControlPolicy,
    private readonly auditLog: WorkspaceIdentityAuditLog,
    private readonly idGenerator: WorkspaceIdentityIdGenerator,
    private readonly secretGenerator: WorkspaceIdentitySecretGenerator,
  ) {}

  public async execute(actor: DesktopClientActor): Promise<StartDesktopPairingResult> {
    await this.featureGatePolicy.assertEnabled("desktop-pairing");
    await this.abuseControlPolicy.assertAllowed({ action: "pairing-start", actor });

    const nowMs = toUnixMilliseconds(Date.now());
    const expiresAtMs = toUnixMilliseconds(nowMs + pairingTtlMs);
    const pairingCode = this.secretGenerator.pairingCode();
    const pairingCodeHash = await this.credentialHasher.hash({
      credential: normalizePairingCode(pairingCode),
      purpose: "pairing-code",
    });
    const pairingSessionId = this.idGenerator.uuid();

    await this.transactionRunner.runInTransaction(async (context) => {
      await this.repository.createPairingSession(
        {
          actor,
          expiresAtMs,
          id: pairingSessionId,
          maxAttempts,
          nowMs,
          pairingCodeHash: pairingCodeHash.value,
        },
        context,
      );
    });
    await this.auditLog.record({
      actor,
      eventType: "desktop_client_pairing_started",
      subjectId: pairingSessionId,
      subjectKind: "desktop_pairing_session",
      workspaceId: actor.workspaceId,
    });

    return {
      expiresAt: new Date(expiresAtMs).toISOString(),
      pairingCode,
      pairingSessionId,
    };
  }
}

export function normalizePairingCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}
