import {
  createSafeError,
  parseDesktopClientId,
  toUnixMilliseconds,
  type DesktopClientId,
} from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "../../domain/workspace-identity.js";
import type { CredentialHasher } from "../ports/credential-hasher.port.js";
import type { DesktopTokenSecretStore } from "../ports/desktop-token-secret-store.js";
import type {
  WorkspaceIdentityIdGenerator,
  WorkspaceIdentitySecretGenerator,
} from "../ports/entropy.js";
import type { WorkspaceIdentityAuditLog } from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";
import type { WorkspaceIdentityRepository } from "../ports/workspace-identity.repository.js";
import { issueDesktopToken } from "./desktop-token.js";

export type RotateDesktopClientTokenResult = Readonly<{
  desktopClientId: DesktopClientId;
  desktopToken: string;
}>;

export class RotateDesktopClientTokenUseCase {
  public constructor(
    private readonly repository: WorkspaceIdentityRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly credentialHasher: CredentialHasher,
    private readonly desktopTokenSecretStore: DesktopTokenSecretStore,
    private readonly auditLog: WorkspaceIdentityAuditLog,
    private readonly idGenerator: WorkspaceIdentityIdGenerator,
    private readonly secretGenerator: WorkspaceIdentitySecretGenerator,
  ) {}

  public async execute(input: {
    actor: DesktopClientActor;
    desktopClientId: string;
    rotationRequestId?: string;
  }): Promise<RotateDesktopClientTokenResult> {
    const desktopClientId = parseDesktopClientId(input.desktopClientId);
    if (!desktopClientId.ok) {
      throw desktopClientId.error;
    }
    if (desktopClientId.value !== input.actor.desktopClientId) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_DESKTOP_CLIENT_FORBIDDEN",
        message: "Desktop client cannot rotate credentials for another client.",
      });
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
    const encryptedDesktopToken = await this.desktopTokenSecretStore.encryptToken(
      issuedToken.rawToken,
    );
    const nowMs = toUnixMilliseconds(Date.now());

    const rotation = await this.transactionRunner.runInTransaction(async (context) =>
      this.repository.rotateCredential(
        {
          actor: input.actor,
          desktopToken: encryptedDesktopToken,
          newCredential: {
            createdAtMs: nowMs,
            desktopClientId: desktopClientId.value,
            id: credentialId,
            lookupPrefix: issuedToken.lookupPrefix,
            status: "active",
            tokenHash: tokenHash.value,
            tokenVersion: 1,
          },
          nowMs,
          rotationRequestId: input.rotationRequestId ?? credentialId,
        },
        context,
      ),
    );
    if (rotation.kind === "already-completed") {
      return {
        desktopClientId: desktopClientId.value,
        desktopToken: await this.desktopTokenSecretStore.decryptToken(
          rotation.desktopToken,
        ),
      };
    }

    await this.auditLog.record({
      actor: input.actor,
      eventType: "desktop_client_token_rotated",
      subjectId: desktopClientId.value,
      subjectKind: "desktop_client",
      workspaceId: input.actor.workspaceId,
    });

    return {
      desktopClientId: desktopClientId.value,
      desktopToken: issuedToken.rawToken,
    };
  }
}
