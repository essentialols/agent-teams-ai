import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import {
  getPrismaTransactionClient,
  PRISMA_DATABASE_CLIENT,
  type PrismaDatabaseClient,
} from "@agent-teams-control-plane/platform-database";
import {
  createSafeError,
  parseDesktopClientId,
  parseIntegrationConnectionId,
  parseWorkspaceId,
  toUnixMilliseconds,
} from "@agent-teams-control-plane/shared";

import type {
  IntegrationConnection,
  ProviderAccountSnapshot,
  ProviderRepositoryAvailability,
} from "../../domain/integration-connection.js";
import type {
  BindVerifiedInstallationInput,
  IntegrationConnectionRepository,
} from "../../application/ports/integration-connection.repository.js";
import type { TransactionContext } from "../../application/ports/transaction-context.js";

type ConnectionRow = Awaited<
  ReturnType<
    ReturnType<PrismaDatabaseClient["getClient"]>["integrationConnection"]["findFirst"]
  >
>;
type ConnectionListRow = NonNullable<ConnectionRow> & {
  accountSnapshots: Array<{
    providerAccountId: string;
    providerAccountKind: string;
    displayLogin: string;
    avatarUrl: string | null;
    lastVerifiedAt: Date;
  }>;
  repositoryAvailability: Array<{ id: string }>;
  repositorySyncCursors: Array<{
    cursorKind: string;
    status: string;
    cursorValue: string | null;
  }>;
};

@Injectable()
export class PrismaIntegrationConnectionRepository implements IntegrationConnectionRepository {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
  ) {}

  public async listForWorkspace(
    workspaceId: Parameters<IntegrationConnectionRepository["listForWorkspace"]>[0],
  ): Promise<readonly IntegrationConnection[]> {
    const rows = await this.databaseClient.getClient().integrationConnection.findMany({
      include: {
        accountSnapshots: true,
        repositoryAvailability: {
          select: { id: true },
        },
        repositorySyncCursors: true,
      },
      orderBy: { createdAt: "desc" },
      where: {
        status: {
          not: "deleted",
        },
        workspaceId,
      },
    });

    return rows.map((row) => mapConnectionRow(row));
  }

  public async bindVerifiedInstallation(
    input: BindVerifiedInstallationInput,
    context: TransactionContext,
  ): Promise<IntegrationConnection> {
    const client = getPrismaTransactionClient(context);
    await client.$queryRaw<readonly { locked: unknown }[]>`
      SELECT pg_advisory_xact_lock(hashtext('github'), hashtext(${input.githubInstallationId})) AS locked
    `;
    const existing = await client.integrationConnection.findFirst({
      include: {
        accountSnapshots: true,
        repositoryAvailability: { select: { id: true } },
        repositorySyncCursors: true,
      },
      where: {
        provider: "github",
        providerInstallationId: input.githubInstallationId,
        status: { not: "deleted" },
      },
    });

    if (existing !== null && existing.status === "suspended") {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_INTEGRATION_CONNECTION_SUSPENDED",
        message: "Integration connection is suspended.",
      });
    }
    if (existing !== null && existing.workspaceId !== input.workspaceId) {
      throw createSafeError({
        category: "conflict",
        code: "CONTROL_PLANE_GITHUB_INSTALLATION_ALREADY_BOUND",
        message: "GitHub installation is already bound to another workspace.",
      });
    }

    const connection =
      existing ??
      (await client.integrationConnection.create({
        data: {
          claimedByDesktopClientId: input.claimedByDesktopClientId,
          createdAt: new Date(input.nowMs),
          id: input.connectionId,
          provider: "github",
          providerConnectionKind: "app_installation",
          providerInstallationId: input.githubInstallationId,
          status: "active",
          updatedAt: new Date(input.nowMs),
          workspaceId: input.workspaceId,
        },
        include: {
          accountSnapshots: true,
          repositoryAvailability: { select: { id: true } },
          repositorySyncCursors: true,
        },
      }));

    await client.integrationConnection.update({
      data: {
        claimedByDesktopClientId: input.claimedByDesktopClientId,
        status: "active",
        updatedAt: new Date(input.nowMs),
      },
      where: { id: connection.id },
    });
    await upsertAccountSnapshot(client, connection.id, input.account);
    await upsertInstallationSnapshot(client, connection.id, input);
    for (const repository of input.repositories) {
      await upsertRepositoryAvailability(client, connection.id, repository);
      await upsertRepositorySnapshot(client, connection.id, repository);
    }
    await upsertRepositorySyncCursor(client, connection.id, input);

    const updated = await client.integrationConnection.findFirst({
      include: {
        accountSnapshots: true,
        repositoryAvailability: { select: { id: true } },
        repositorySyncCursors: true,
      },
      where: { id: connection.id },
    });
    if (updated === null) {
      throw createSafeError({
        category: "internal",
        code: "CONTROL_PLANE_CONNECTION_BIND_FAILED",
        message: "Integration connection could not be bound.",
      });
    }
    return mapConnectionRow(updated);
  }
}

async function upsertAccountSnapshot(
  client: ReturnType<typeof getPrismaTransactionClient>,
  connectionId: string,
  account: ProviderAccountSnapshot,
): Promise<void> {
  await client.providerAccountSnapshot.upsert({
    create: {
      displayLogin: account.displayLogin,
      id: randomUUID(),
      integrationConnectionId: connectionId,
      lastVerifiedAt: new Date(account.lastVerifiedAtMs),
      providerAccountId: account.providerAccountId,
      providerAccountKind: account.providerAccountKind,
      ...(account.avatarUrl === undefined ? {} : { avatarUrl: account.avatarUrl }),
    },
    update: {
      displayLogin: account.displayLogin,
      lastVerifiedAt: new Date(account.lastVerifiedAtMs),
      providerAccountKind: account.providerAccountKind,
      ...(account.avatarUrl === undefined ? {} : { avatarUrl: account.avatarUrl }),
    },
    where: {
      integrationConnectionId_providerAccountId: {
        integrationConnectionId: connectionId,
        providerAccountId: account.providerAccountId,
      },
    },
  });
}

async function upsertInstallationSnapshot(
  client: ReturnType<typeof getPrismaTransactionClient>,
  connectionId: string,
  input: BindVerifiedInstallationInput,
): Promise<void> {
  await client.gitHubInstallationSnapshot.upsert({
    create: {
      githubAccountId: input.account.providerAccountId,
      githubAccountLogin: input.account.displayLogin,
      githubAccountType: input.account.providerAccountKind,
      githubInstallationId: input.githubInstallationId,
      id: randomUUID(),
      integrationConnectionId: connectionId,
      lastVerifiedAt: new Date(input.nowMs),
      repositorySelection: input.repositorySyncStatus.complete ? "complete" : "partial",
    },
    update: {
      githubAccountId: input.account.providerAccountId,
      githubAccountLogin: input.account.displayLogin,
      githubAccountType: input.account.providerAccountKind,
      lastVerifiedAt: new Date(input.nowMs),
      repositorySelection: input.repositorySyncStatus.complete ? "complete" : "partial",
    },
    where: {
      integrationConnectionId_githubInstallationId: {
        githubInstallationId: input.githubInstallationId,
        integrationConnectionId: connectionId,
      },
    },
  });
}

async function upsertRepositoryAvailability(
  client: ReturnType<typeof getPrismaTransactionClient>,
  connectionId: string,
  repository: ProviderRepositoryAvailability,
): Promise<void> {
  await client.providerRepositoryAvailability.upsert({
    create: {
      archived: repository.archived,
      available: repository.available,
      displayFullName: repository.displayFullName,
      displayName: repository.displayName,
      displayOwner: repository.displayOwner,
      id: randomUUID(),
      integrationConnectionId: connectionId,
      lastVerifiedAt: new Date(repository.lastVerifiedAtMs),
      private: repository.private,
      providerRepositoryId: repository.providerRepositoryId,
    },
    update: {
      archived: repository.archived,
      available: repository.available,
      displayFullName: repository.displayFullName,
      displayName: repository.displayName,
      displayOwner: repository.displayOwner,
      lastVerifiedAt: new Date(repository.lastVerifiedAtMs),
      private: repository.private,
    },
    where: {
      integrationConnectionId_providerRepositoryId: {
        integrationConnectionId: connectionId,
        providerRepositoryId: repository.providerRepositoryId,
      },
    },
  });
}

async function upsertRepositorySnapshot(
  client: ReturnType<typeof getPrismaTransactionClient>,
  connectionId: string,
  repository: ProviderRepositoryAvailability,
): Promise<void> {
  await client.gitHubRepositorySnapshot.upsert({
    create: {
      archived: repository.archived,
      displayFullName: repository.displayFullName,
      githubRepositoryId: repository.providerRepositoryId,
      id: randomUUID(),
      integrationConnectionId: connectionId,
      lastVerifiedAt: new Date(repository.lastVerifiedAtMs),
      private: repository.private,
    },
    update: {
      archived: repository.archived,
      displayFullName: repository.displayFullName,
      lastVerifiedAt: new Date(repository.lastVerifiedAtMs),
      private: repository.private,
    },
    where: {
      integrationConnectionId_githubRepositoryId: {
        githubRepositoryId: repository.providerRepositoryId,
        integrationConnectionId: connectionId,
      },
    },
  });
}

async function upsertRepositorySyncCursor(
  client: ReturnType<typeof getPrismaTransactionClient>,
  connectionId: string,
  input: BindVerifiedInstallationInput,
): Promise<void> {
  await client.providerRepositorySyncCursor.upsert({
    create: {
      cursorKind: "github_installation_repositories",
      id: randomUUID(),
      integrationConnectionId: connectionId,
      provider: "github",
      startedAt: new Date(input.nowMs),
      status: input.repositorySyncStatus.complete ? "completed" : "pending",
      ...(input.repositorySyncStatus.nextCursor === undefined
        ? {}
        : { cursorValue: input.repositorySyncStatus.nextCursor }),
      ...(input.repositorySyncStatus.complete
        ? { completedAt: new Date(input.nowMs) }
        : {}),
    },
    update: {
      cursorValue: input.repositorySyncStatus.nextCursor ?? null,
      status: input.repositorySyncStatus.complete ? "completed" : "pending",
      ...(input.repositorySyncStatus.complete
        ? { completedAt: new Date(input.nowMs) }
        : {}),
    },
    where: {
      integrationConnectionId_provider_cursorKind: {
        cursorKind: "github_installation_repositories",
        integrationConnectionId: connectionId,
        provider: "github",
      },
    },
  });
}

function mapConnectionRow(row: ConnectionListRow): IntegrationConnection {
  const id = parseIntegrationConnectionId(row.id);
  const workspaceId = parseWorkspaceId(row.workspaceId);
  if (!id.ok) {
    throw id.error;
  }
  if (!workspaceId.ok) {
    throw workspaceId.error;
  }
  const claimedByDesktopClientId =
    row.claimedByDesktopClientId === null
      ? undefined
      : parseDesktopClientId(row.claimedByDesktopClientId);
  if (claimedByDesktopClientId !== undefined && !claimedByDesktopClientId.ok) {
    throw claimedByDesktopClientId.error;
  }
  const cursor = row.repositorySyncCursors.find(
    (item) => item.cursorKind === "github_installation_repositories",
  );
  const account = row.accountSnapshots[0];
  return {
    createdAtMs: toUnixMilliseconds(row.createdAt.getTime()),
    id: id.value,
    provider: "github",
    providerConnectionKind: "app_installation",
    providerInstallationId: row.providerInstallationId,
    repositoryCount: row.repositoryAvailability.length,
    repositorySyncStatus: {
      complete: cursor?.status === "completed",
      ...(cursor?.cursorValue === null || cursor?.cursorValue === undefined
        ? {}
        : { nextCursor: cursor.cursorValue }),
    },
    status: assertConnectionStatus(row.status),
    updatedAtMs: toUnixMilliseconds(row.updatedAt.getTime()),
    workspaceId: workspaceId.value,
    ...(claimedByDesktopClientId === undefined
      ? {}
      : { claimedByDesktopClientId: claimedByDesktopClientId.value }),
    ...(account === undefined
      ? {}
      : {
          account: {
            displayLogin: account.displayLogin,
            lastVerifiedAtMs: toUnixMilliseconds(account.lastVerifiedAt.getTime()),
            providerAccountId: account.providerAccountId,
            providerAccountKind: assertProviderAccountKind(account.providerAccountKind),
            ...(account.avatarUrl === null ? {} : { avatarUrl: account.avatarUrl }),
          },
        }),
  };
}

function assertConnectionStatus(value: string): IntegrationConnection["status"] {
  if (value === "active" || value === "suspended" || value === "deleted") {
    return value;
  }
  throw new Error(`Unknown integration connection status ${value}`);
}

function assertProviderAccountKind(value: string): "Organization" | "User" {
  if (value === "Organization" || value === "User") {
    return value;
  }
  throw new Error(`Unknown provider account kind ${value}`);
}
