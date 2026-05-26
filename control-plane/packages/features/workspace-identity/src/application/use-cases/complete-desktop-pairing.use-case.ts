import {
  createSafeError,
  parseDesktopClientId,
  toUnixMilliseconds,
  type DesktopClientId,
  type WorkspaceId,
} from "@agent-teams-control-plane/shared";

import type { DesktopClient } from "../../domain/workspace-identity.js";
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
import { normalizeDisplayName } from "./bootstrap-workspace.use-case.js";
import { issueDesktopToken } from "./desktop-token.js";
import { normalizePairingCode } from "./start-desktop-pairing.use-case.js";

export type CompleteDesktopPairingInput = Readonly<{
  pairingCode: string;
  desktopDisplayName?: string;
}>;

export type CompleteDesktopPairingResult = Readonly<{
  workspaceId: WorkspaceId;
  desktopClientId: DesktopClientId;
  desktopToken: string;
}>;

export class CompleteDesktopPairingUseCase {
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

  public async execute(
    input: CompleteDesktopPairingInput,
  ): Promise<CompleteDesktopPairingResult> {
    await this.featureGatePolicy.assertEnabled("desktop-pairing");
    await this.abuseControlPolicy.assertAllowed({
      action: "pairing-complete",
      key: "public-pairing",
    });

    const normalizedCode = normalizePairingCode(input.pairingCode);
    if (normalizedCode.length === 0) {
      throw invalidPairingCodeError();
    }

    const pairingHash = await this.credentialHasher.hash({
      credential: normalizedCode,
      purpose: "pairing-code",
    });
    const nowMs = toUnixMilliseconds(Date.now());
    const desktopClientId = parseDesktopClientId(this.idGenerator.uuid());
    if (!desktopClientId.ok) {
      throw desktopClientId.error;
    }
    const credentialId = this.idGenerator.uuid();
    const issuedToken = issueDesktopToken({
      credentialId,
      secretGenerator: this.secretGenerator,
    });
    const tokenHash = await this.credentialHasher.hash({
      credential: issuedToken.rawToken,
      purpose: "desktop-token",
    });
    const desktopClient: DesktopClient = {
      createdAtMs: nowMs,
      displayName: normalizeDisplayName(input.desktopDisplayName, "Paired Desktop"),
      id: desktopClientId.value,
      status: "active",
      workspaceId: "" as WorkspaceId,
    };

    const result = await this.transactionRunner.runInTransaction(async (context) =>
      this.repository.completePairing(
        {
          credential: {
            createdAtMs: nowMs,
            desktopClientId: desktopClient.id,
            id: credentialId,
            lookupPrefix: issuedToken.lookupPrefix,
            status: "active",
            tokenHash: tokenHash.value,
            tokenVersion: 1,
          },
          desktopClient,
          nowMs,
          pairingCodeHash: pairingHash.value,
        },
        context,
      ),
    );
    if (result.kind === "rejected") {
      throw invalidPairingCodeError();
    }
    await this.auditLog.record({
      eventType: "desktop_client_pairing_completed",
      subjectId: result.desktopClientId,
      subjectKind: "desktop_client",
      workspaceId: result.workspaceId,
    });

    return {
      desktopClientId: result.desktopClientId,
      desktopToken: issuedToken.rawToken,
      workspaceId: result.workspaceId,
    };
  }
}

function invalidPairingCodeError() {
  return createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_PAIRING_CODE_INVALID",
    message: "Pairing code is invalid or expired.",
  });
}
