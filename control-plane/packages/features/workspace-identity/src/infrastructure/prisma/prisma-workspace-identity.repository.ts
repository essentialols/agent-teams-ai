import { Inject, Injectable } from "@nestjs/common";

import {
  getPrismaTransactionClient,
  PRISMA_DATABASE_CLIENT,
  type PrismaClientLike,
  type PrismaDatabaseClient,
  type PrismaTransactionClientLike,
} from "@agent-teams-control-plane/platform-database";
import {
  createSafeError,
  parseDesktopClientId,
  parseWorkspaceId,
  toUnixMilliseconds,
  type DesktopClientId,
} from "@agent-teams-control-plane/shared";

import type {
  DesktopClient,
  DesktopClientCredential,
  Workspace,
} from "../../domain/workspace-identity.js";
import type { TransactionContext } from "../../application/ports/transaction-runner.js";
import type { StoredDesktopToken } from "../../application/ports/desktop-token-secret-store.js";
import type {
  DesktopCredentialRotationResult,
  BootstrapWorkspaceInput,
  DesktopCredentialLookup,
  PairingCompletionInput,
  PairingCompletionResult,
  WorkspaceIdentityRepository,
} from "../../application/ports/workspace-identity.repository.js";

type PrismaWriteClient = PrismaClientLike | PrismaTransactionClientLike;
type CredentialRow = Awaited<
  ReturnType<
    ReturnType<PrismaDatabaseClient["getClient"]>["desktopClientCredential"]["findUnique"]
  >
>;

@Injectable()
export class PrismaWorkspaceIdentityRepository implements WorkspaceIdentityRepository {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
  ) {}

  public async createBootstrapWorkspace(
    input: BootstrapWorkspaceInput,
    context: TransactionContext,
  ): Promise<void> {
    const client = getPrismaTransactionClient(context);
    await client.workspace.create({
      data: {
        createdAt: new Date(input.workspace.createdAtMs),
        createdByBootstrapKind: "anonymous_desktop_bootstrap",
        displayName: input.workspace.displayName,
        id: input.workspace.id,
        status: input.workspace.status,
        updatedAt: new Date(input.workspace.updatedAtMs),
      },
    });
    await client.desktopClient.create({
      data: {
        createdAt: new Date(input.desktopClient.createdAtMs),
        displayName: input.desktopClient.displayName,
        id: input.desktopClient.id,
        status: input.desktopClient.status,
        workspaceId: input.desktopClient.workspaceId,
      },
    });
    await createCredential(client, input.credential);
  }

  public async findCredentialByLookupPrefix(
    lookupPrefix: string,
  ): Promise<DesktopCredentialLookup | undefined> {
    const row = await this.databaseClient.getClient().desktopClientCredential.findUnique({
      include: {
        desktopClient: {
          include: {
            workspace: true,
          },
        },
      },
      where: { lookupPrefix },
    });

    if (row === null) {
      return undefined;
    }
    return {
      client: mapDesktopClient(row.desktopClient),
      credential: mapCredential(row),
      workspace: mapWorkspace(row.desktopClient.workspace),
    };
  }

  public async markCredentialUsed(input: {
    credentialId: string;
    desktopClientId: DesktopClientId;
    nowMs: number;
  }): Promise<void> {
    await this.databaseClient.getClient().$transaction(async (client) => {
      await client.desktopClientCredential.updateMany({
        data: { lastUsedAt: new Date(input.nowMs) },
        where: { id: input.credentialId, status: "active" },
      });
      await client.desktopClient.updateMany({
        data: { lastSeenAt: new Date(input.nowMs) },
        where: { id: input.desktopClientId, status: "active" },
      });
    });
  }

  public async rotateCredential(
    input: Parameters<WorkspaceIdentityRepository["rotateCredential"]>[0],
    context: TransactionContext,
  ): Promise<DesktopCredentialRotationResult> {
    const client = getPrismaTransactionClient(context);
    const lockedClient = await client.$queryRaw<readonly { id: string }[]>`
      SELECT id
      FROM desktop_clients
      WHERE id = ${input.actor.desktopClientId}
        AND workspace_id = ${input.actor.workspaceId}
        AND status = 'active'
      FOR UPDATE
    `;
    if (lockedClient.length === 0) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_DESKTOP_AUTH_INVALID",
        message: "Desktop client authentication failed.",
      });
    }
    const existingRotation = await client.desktopClientCredential.findFirst({
      where: {
        desktopClientId: input.actor.desktopClientId,
        rotationRequestId: input.rotationRequestId,
      },
    });
    if (existingRotation !== null) {
      const desktopToken = parseStoredDesktopToken(
        existingRotation.issuedTokenCiphertextJson,
      );
      if (desktopToken === undefined) {
        throw createSafeError({
          category: "internal",
          code: "CONTROL_PLANE_DESKTOP_ROTATION_TOKEN_MISSING",
          message: "Desktop token rotation idempotency data is missing.",
        });
      }
      return { desktopToken, kind: "already-completed" };
    }

    const activeCredential = await client.desktopClientCredential.findFirst({
      orderBy: { tokenVersion: "desc" },
      where: {
        desktopClientId: input.actor.desktopClientId,
        status: "active",
      },
    });
    await client.desktopClientCredential.updateMany({
      data: {
        revokedAt: new Date(input.nowMs),
        status: "revoked",
      },
      where: {
        desktopClientId: input.actor.desktopClientId,
        status: "active",
      },
    });
    const lastCredential = await client.desktopClientCredential.findFirst({
      orderBy: { tokenVersion: "desc" },
      where: { desktopClientId: input.actor.desktopClientId },
    });
    await createCredential(
      client,
      {
        ...input.newCredential,
        tokenVersion: (lastCredential?.tokenVersion ?? 0) + 1,
      },
      {
        desktopToken: input.desktopToken,
        rotationRequestId: input.rotationRequestId,
        ...(activeCredential === null
          ? {}
          : { rotatedFromCredentialId: activeCredential.id }),
      },
    );
    return { kind: "created" };
  }

  public async revokeDesktopClient(
    input: Parameters<WorkspaceIdentityRepository["revokeDesktopClient"]>[0],
    context: TransactionContext,
  ): Promise<void> {
    const client = getPrismaTransactionClient(context);
    await client.desktopClient.updateMany({
      data: {
        revokedAt: new Date(input.nowMs),
        status: "revoked",
      },
      where: {
        id: input.desktopClientId,
        workspaceId: input.actor.workspaceId,
      },
    });
    await client.desktopClientCredential.updateMany({
      data: {
        revokedAt: new Date(input.nowMs),
        status: "revoked",
      },
      where: {
        desktopClientId: input.desktopClientId,
        status: "active",
      },
    });
  }

  public async createPairingSession(
    input: Parameters<WorkspaceIdentityRepository["createPairingSession"]>[0],
    context: TransactionContext,
  ): Promise<void> {
    const client = getPrismaTransactionClient(context);
    await client.desktopPairingSession.create({
      data: {
        createdAt: new Date(input.nowMs),
        expiresAt: new Date(input.expiresAtMs),
        id: input.id,
        maxAttempts: input.maxAttempts,
        pairingCodeHash: input.pairingCodeHash,
        requestedByDesktopClientId: input.actor.desktopClientId,
        status: "created",
        workspaceId: input.actor.workspaceId,
      },
    });
  }

  public async completePairing(
    input: PairingCompletionInput,
    context: TransactionContext,
  ): Promise<PairingCompletionResult> {
    const client = getPrismaTransactionClient(context);
    const session = await client.desktopPairingSession.findFirst({
      where: {
        pairingCodeHash: input.pairingCodeHash,
        status: "created",
      },
    });
    if (session === null) {
      return { kind: "rejected" };
    }
    if (
      session.expiresAt.getTime() <= input.nowMs ||
      session.attemptCount >= session.maxAttempts
    ) {
      await client.desktopPairingSession.update({
        data: {
          attemptCount: { increment: 1 },
          status: "expired",
        },
        where: { id: session.id },
      });
      return { kind: "rejected" };
    }

    const workspaceId = parseWorkspaceId(session.workspaceId);
    if (!workspaceId.ok) {
      throw workspaceId.error;
    }
    await client.desktopClient.create({
      data: {
        createdAt: new Date(input.desktopClient.createdAtMs),
        displayName: input.desktopClient.displayName,
        id: input.desktopClient.id,
        status: "active",
        workspaceId: session.workspaceId,
      },
    });
    await createCredential(client, {
      ...input.credential,
      desktopClientId: input.desktopClient.id,
    });
    await client.desktopPairingSession.update({
      data: {
        consumedAt: new Date(input.nowMs),
        consumedByDesktopClientId: input.desktopClient.id,
        status: "consumed",
      },
      where: { id: session.id },
    });

    return {
      desktopClientId: input.desktopClient.id,
      kind: "completed",
      workspaceId: workspaceId.value,
    };
  }
}

async function createCredential(
  client: PrismaWriteClient,
  credential: DesktopClientCredential,
  metadata: {
    desktopToken?: StoredDesktopToken;
    rotatedFromCredentialId?: string;
    rotationRequestId?: string;
  } = {},
): Promise<void> {
  await client.desktopClientCredential.create({
    data: {
      createdAt: new Date(credential.createdAtMs),
      desktopClientId: credential.desktopClientId,
      id: credential.id,
      lookupPrefix: credential.lookupPrefix,
      status: credential.status,
      tokenHash: credential.tokenHash,
      tokenVersion: credential.tokenVersion,
      ...(metadata.desktopToken === undefined
        ? {}
        : {
            issuedTokenCiphertextJson: serializeStoredDesktopToken(metadata.desktopToken),
          }),
      ...(metadata.rotatedFromCredentialId === undefined
        ? {}
        : { rotatedFromCredentialId: metadata.rotatedFromCredentialId }),
      ...(metadata.rotationRequestId === undefined
        ? {}
        : { rotationRequestId: metadata.rotationRequestId }),
      ...(credential.expiresAtMs === undefined
        ? {}
        : { expiresAt: new Date(credential.expiresAtMs) }),
      ...(credential.revokedAtMs === undefined
        ? {}
        : { revokedAt: new Date(credential.revokedAtMs) }),
    },
  });
}

function serializeStoredDesktopToken(
  stored: StoredDesktopToken,
): Record<keyof StoredDesktopToken, string> {
  return {
    ciphertext: stored.ciphertext,
    ciphertextSha256: stored.ciphertextSha256,
    contentAuthTag: stored.contentAuthTag,
    contentEncryptionAlgorithm: stored.contentEncryptionAlgorithm,
    contentNonce: stored.contentNonce,
    dataKeyAlgorithm: stored.dataKeyAlgorithm,
    dataKeyAuthTag: stored.dataKeyAuthTag,
    dataKeyNonce: stored.dataKeyNonce,
    encryptedDataKey: stored.encryptedDataKey,
    keyRef: stored.keyRef,
  };
}

function parseStoredDesktopToken(value: unknown): StoredDesktopToken | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const stored = value as Partial<Record<keyof StoredDesktopToken, unknown>>;
  if (
    typeof stored.ciphertext !== "string" ||
    typeof stored.ciphertextSha256 !== "string" ||
    typeof stored.contentAuthTag !== "string" ||
    stored.contentEncryptionAlgorithm !== "AES-256-GCM" ||
    typeof stored.contentNonce !== "string" ||
    stored.dataKeyAlgorithm !== "AES-256-GCM" ||
    typeof stored.dataKeyAuthTag !== "string" ||
    typeof stored.dataKeyNonce !== "string" ||
    typeof stored.encryptedDataKey !== "string" ||
    typeof stored.keyRef !== "string"
  ) {
    return undefined;
  }
  return {
    ciphertext: stored.ciphertext,
    ciphertextSha256: stored.ciphertextSha256,
    contentAuthTag: stored.contentAuthTag,
    contentEncryptionAlgorithm: stored.contentEncryptionAlgorithm,
    contentNonce: stored.contentNonce,
    dataKeyAlgorithm: stored.dataKeyAlgorithm,
    dataKeyAuthTag: stored.dataKeyAuthTag,
    dataKeyNonce: stored.dataKeyNonce,
    encryptedDataKey: stored.encryptedDataKey,
    keyRef: stored.keyRef,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mapWorkspace(row: {
  id: string;
  displayName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Workspace {
  const id = parseWorkspaceId(row.id);
  if (!id.ok) {
    throw id.error;
  }
  return {
    createdAtMs: toUnixMilliseconds(row.createdAt.getTime()),
    displayName: row.displayName,
    id: id.value,
    status: assertWorkspaceStatus(row.status),
    updatedAtMs: toUnixMilliseconds(row.updatedAt.getTime()),
  };
}

function mapDesktopClient(row: {
  id: string;
  workspaceId: string;
  displayName: string;
  status: string;
  createdAt: Date;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
}): DesktopClient {
  const id = parseDesktopClientId(row.id);
  const workspaceId = parseWorkspaceId(row.workspaceId);
  if (!id.ok) {
    throw id.error;
  }
  if (!workspaceId.ok) {
    throw workspaceId.error;
  }
  return {
    createdAtMs: toUnixMilliseconds(row.createdAt.getTime()),
    displayName: row.displayName,
    id: id.value,
    status: assertDesktopClientStatus(row.status),
    workspaceId: workspaceId.value,
    ...(row.lastSeenAt === null
      ? {}
      : { lastSeenAtMs: toUnixMilliseconds(row.lastSeenAt.getTime()) }),
    ...(row.revokedAt === null
      ? {}
      : { revokedAtMs: toUnixMilliseconds(row.revokedAt.getTime()) }),
  };
}

function mapCredential(row: NonNullable<CredentialRow>): DesktopClientCredential {
  const desktopClientId = parseDesktopClientId(row.desktopClientId);
  if (!desktopClientId.ok) {
    throw desktopClientId.error;
  }
  return {
    createdAtMs: toUnixMilliseconds(row.createdAt.getTime()),
    desktopClientId: desktopClientId.value,
    id: row.id,
    lookupPrefix: row.lookupPrefix,
    status: assertDesktopCredentialStatus(row.status),
    tokenHash: row.tokenHash,
    tokenVersion: row.tokenVersion,
    ...(row.expiresAt === null
      ? {}
      : { expiresAtMs: toUnixMilliseconds(row.expiresAt.getTime()) }),
    ...(row.lastUsedAt === null
      ? {}
      : { lastUsedAtMs: toUnixMilliseconds(row.lastUsedAt.getTime()) }),
    ...(row.revokedAt === null
      ? {}
      : { revokedAtMs: toUnixMilliseconds(row.revokedAt.getTime()) }),
  };
}

function assertWorkspaceStatus(value: string): Workspace["status"] {
  if (
    value === "active" ||
    value === "disabled" ||
    value === "pending_cleanup" ||
    value === "deleted"
  ) {
    return value;
  }
  throw new Error(`Unknown workspace status ${value}`);
}

function assertDesktopClientStatus(value: string): DesktopClient["status"] {
  if (
    value === "active" ||
    value === "rotating" ||
    value === "revoked" ||
    value === "expired"
  ) {
    return value;
  }
  throw new Error(`Unknown desktop client status ${value}`);
}

function assertDesktopCredentialStatus(value: string): DesktopClientCredential["status"] {
  if (value === "active" || value === "revoked" || value === "expired") {
    return value;
  }
  throw new Error(`Unknown desktop credential status ${value}`);
}
