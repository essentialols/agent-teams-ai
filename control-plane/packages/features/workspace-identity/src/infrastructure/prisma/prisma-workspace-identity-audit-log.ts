import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import {
  PRISMA_DATABASE_CLIENT,
  type PrismaDatabaseClient,
} from "@agent-teams-control-plane/platform-database";

import type { WorkspaceIdentityAuditLog } from "../../application/ports/policies.js";

@Injectable()
export class PrismaWorkspaceIdentityAuditLog implements WorkspaceIdentityAuditLog {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
  ) {}

  public async record(
    input: Parameters<WorkspaceIdentityAuditLog["record"]>[0],
  ): Promise<void> {
    if (!this.databaseClient.isEnabled()) {
      return;
    }
    const workspaceId = input.workspaceId ?? input.actor?.workspaceId;
    await this.databaseClient.getClient().auditEvent.create({
      data: {
        actorKind: input.actor === undefined ? "system" : "desktop_client",
        eventType: input.eventType,
        id: randomUUID(),
        safeMetadataJson: input.safeMetadata ?? {},
        ...(input.actor === undefined ? {} : { actorId: input.actor.desktopClientId }),
        ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId }),
        ...(input.subjectKind === undefined ? {} : { subjectKind: input.subjectKind }),
        ...(workspaceId === undefined ? {} : { workspaceId }),
      },
    });
  }
}
