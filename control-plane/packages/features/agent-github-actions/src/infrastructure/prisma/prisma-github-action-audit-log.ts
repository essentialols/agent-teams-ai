import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import {
  PRISMA_DATABASE_CLIENT,
  type PrismaDatabaseClient,
} from "@agent-teams-control-plane/platform-database";

import type { AgentGitHubActionsAuditLog } from "../../application/ports/policies.js";

@Injectable()
export class PrismaGitHubActionAuditLog implements AgentGitHubActionsAuditLog {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
  ) {}

  public async record(
    input: Parameters<AgentGitHubActionsAuditLog["record"]>[0],
  ): Promise<void> {
    if (!this.databaseClient.isEnabled()) {
      return;
    }
    await this.databaseClient.getClient().auditEvent.create({
      data: {
        actorKind: input.actorKind,
        eventType: input.eventType,
        id: randomUUID(),
        safeMetadataJson: {
          ...(input.safeMetadata ?? {}),
          status: input.status,
          ...(input.actionRequestId === undefined
            ? {}
            : { actionRequestId: input.actionRequestId }),
          ...(input.integrationTargetId === undefined
            ? {}
            : { integrationTargetId: input.integrationTargetId }),
          ...(input.safeErrorCode === undefined
            ? {}
            : { safeErrorCode: input.safeErrorCode }),
        },
        ...(input.actorId === undefined ? {} : { actorId: input.actorId }),
        ...(input.correlationId === undefined
          ? {}
          : { correlationId: input.correlationId }),
        ...(input.actionRequestId === undefined
          ? {}
          : { requestId: input.actionRequestId }),
        ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId }),
        ...(input.subjectKind === undefined ? {} : { subjectKind: input.subjectKind }),
        ...(input.workspaceId === undefined ? {} : { workspaceId: input.workspaceId }),
      },
    });
  }
}
