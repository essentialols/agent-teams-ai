import {
  createSafeError,
  parseDesktopClientId,
  toUnixMilliseconds,
} from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "../../domain/workspace-identity.js";
import type { WorkspaceIdentityAuditLog } from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";
import type { WorkspaceIdentityRepository } from "../ports/workspace-identity.repository.js";

export class RevokeDesktopClientUseCase {
  public constructor(
    private readonly repository: WorkspaceIdentityRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly auditLog: WorkspaceIdentityAuditLog,
  ) {}

  public async execute(input: {
    actor: DesktopClientActor;
    desktopClientId: string;
  }): Promise<void> {
    const desktopClientId = parseDesktopClientId(input.desktopClientId);
    if (!desktopClientId.ok) {
      throw desktopClientId.error;
    }
    if (desktopClientId.value !== input.actor.desktopClientId) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_DESKTOP_CLIENT_FORBIDDEN",
        message: "Desktop client cannot revoke another client in Phase 5.",
      });
    }

    await this.transactionRunner.runInTransaction(async (context) => {
      await this.repository.revokeDesktopClient(
        {
          actor: input.actor,
          desktopClientId: desktopClientId.value,
          nowMs: toUnixMilliseconds(Date.now()),
        },
        context,
      );
    });
    await this.auditLog.record({
      actor: input.actor,
      eventType: "desktop_client_revoked",
      subjectId: desktopClientId.value,
      subjectKind: "desktop_client",
      workspaceId: input.actor.workspaceId,
    });
  }
}
