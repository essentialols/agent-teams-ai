import { Inject, Injectable } from "@nestjs/common";

import {
  getPrismaTransactionClient,
  PRISMA_DATABASE_CLIENT,
  type PrismaDatabaseClient,
} from "@agent-teams-control-plane/platform-database";
import {
  parseExternalActionContentId,
  toUnixMilliseconds,
} from "@agent-teams-control-plane/shared";

import type {
  EncryptedExternalActionContent,
  ExternalActionContentRef,
} from "../../domain/external-action-content.js";
import type { ExternalActionContentRepository } from "../../application/ports/external-action-content.repository.js";
import type { TransactionContext } from "../../application/ports/transaction-context.js";

type ExternalActionContentRow = Awaited<
  ReturnType<
    ReturnType<PrismaDatabaseClient["getClient"]>["externalActionContent"]["findUnique"]
  >
>;

@Injectable()
export class PrismaExternalActionContentRepository implements ExternalActionContentRepository {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
  ) {}

  public async storeEncrypted(
    input: Parameters<ExternalActionContentRepository["storeEncrypted"]>[0],
    context: TransactionContext,
  ): Promise<ExternalActionContentRef> {
    const client = getPrismaTransactionClient(context);
    await client.externalActionContent.create({
      data: {
        ciphertext: Buffer.from(input.ciphertext),
        ciphertextSha256: input.ciphertextSha256,
        contentAuthTag: Buffer.from(input.contentAuthTag),
        contentEncryptionAlgorithm: input.contentEncryptionAlgorithm,
        contentKind: input.kind,
        contentNonce: Buffer.from(input.contentNonce),
        dataKeyAlgorithm: input.dataKeyAlgorithm,
        dataKeyAuthTag: Buffer.from(input.dataKeyAuthTag),
        dataKeyNonce: Buffer.from(input.dataKeyNonce),
        encryptedDataKey: Buffer.from(input.encryptedDataKey),
        expiresAt: new Date(input.expiresAtMs),
        id: input.id,
        keyRef: input.keyRef,
      },
    });

    return {
      ciphertextSha256: input.ciphertextSha256,
      id: input.id,
    };
  }

  public async findById(
    id: ExternalActionContentRef["id"],
  ): Promise<EncryptedExternalActionContent | undefined> {
    const row = await this.databaseClient.getClient().externalActionContent.findUnique({
      where: { id },
    });

    return row === null ? undefined : mapRow(row);
  }

  public async shred(
    ref: ExternalActionContentRef,
    context: TransactionContext,
  ): Promise<void> {
    const client = getPrismaTransactionClient(context);
    await client.externalActionContent.update({
      data: {
        ciphertext: null,
        contentAuthTag: null,
        contentNonce: null,
        dataKeyAuthTag: null,
        dataKeyNonce: null,
        encryptedDataKey: null,
        shreddedAt: new Date(),
      },
      where: {
        id: ref.id,
      },
    });
  }
}

function mapRow(
  row: NonNullable<ExternalActionContentRow>,
): EncryptedExternalActionContent {
  const id = parseExternalActionContentId(row.id);
  if (!id.ok) {
    throw id.error;
  }

  return {
    ciphertext: row.ciphertext ?? undefined,
    ciphertextSha256: row.ciphertextSha256,
    contentAuthTag: row.contentAuthTag ?? undefined,
    contentEncryptionAlgorithm: row.contentEncryptionAlgorithm,
    contentNonce: row.contentNonce ?? undefined,
    createdAtMs: toUnixMilliseconds(row.createdAt.getTime()),
    dataKeyAlgorithm: row.dataKeyAlgorithm,
    dataKeyAuthTag: row.dataKeyAuthTag ?? undefined,
    dataKeyNonce: row.dataKeyNonce ?? undefined,
    encryptedDataKey: row.encryptedDataKey ?? undefined,
    expiresAtMs: toUnixMilliseconds(row.expiresAt.getTime()),
    id: id.value,
    keyRef: row.keyRef,
    kind: row.contentKind,
    ...(row.deletedAt === null
      ? {}
      : { deletedAtMs: toUnixMilliseconds(row.deletedAt.getTime()) }),
    ...(row.shreddedAt === null
      ? {}
      : { shreddedAtMs: toUnixMilliseconds(row.shreddedAt.getTime()) }),
  };
}
