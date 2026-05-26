import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import {
  PRISMA_DATABASE_CLIENT,
  type PrismaDatabaseClient,
} from "@agent-teams-control-plane/platform-database";

import type { GitHubTokenBrokerAuditLog } from "../../application/ports/policies.js";

@Injectable()
export class PrismaGitHubTokenBrokerAuditLog implements GitHubTokenBrokerAuditLog {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
  ) {}

  public async record(
    input: Parameters<GitHubTokenBrokerAuditLog["record"]>[0],
  ): Promise<void> {
    if (!this.databaseClient.isEnabled()) {
      return;
    }
    await this.databaseClient.getClient().auditEvent.create({
      data: {
        actorKind: "system",
        eventType: input.eventType,
        id: randomUUID(),
        safeMetadataJson: {
          capability: input.capability ?? null,
          githubInstallationId: input.githubInstallationId ?? null,
          permissionSummary: input.permissionSummary ?? {},
          repositoryCount: input.repositoryCount ?? null,
          safeErrorCode: input.safeErrorCode ?? null,
          status: input.status,
        },
        ...(input.correlationId === undefined
          ? {}
          : { correlationId: input.correlationId }),
        ...(input.integrationTargetId === undefined
          ? {}
          : {
              subjectId: input.integrationTargetId,
              subjectKind: "integration_target",
            }),
        ...(input.workspaceId === undefined ? {} : { workspaceId: input.workspaceId }),
      },
    });
  }
}
