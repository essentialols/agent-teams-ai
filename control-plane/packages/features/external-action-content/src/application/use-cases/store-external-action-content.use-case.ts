import {
  toUnixMilliseconds,
  type ExternalActionContentId,
} from "@agent-teams-control-plane/shared";

import type { ExternalActionContentRef } from "../../domain/external-action-content.js";
import type { ExternalActionContentEncryptionPort } from "../ports/external-action-content-encryption.port.js";
import type { ExternalActionContentRepository } from "../ports/external-action-content.repository.js";
import type { TransactionContext } from "../ports/transaction-context.js";

export type StoreExternalActionContentInput = Readonly<{
  id: ExternalActionContentId;
  kind: string;
  plaintext: Uint8Array;
  expiresAt: Date;
  context: TransactionContext;
}>;

export class StoreExternalActionContentUseCase {
  public constructor(
    private readonly repository: ExternalActionContentRepository,
    private readonly encryption: ExternalActionContentEncryptionPort,
  ) {}

  public async execute(
    input: StoreExternalActionContentInput,
  ): Promise<ExternalActionContentRef> {
    const encrypted = await this.encryption.encrypt(input.plaintext);

    return this.repository.storeEncrypted(
      {
        contentAuthTag: encrypted.contentAuthTag,
        contentEncryptionAlgorithm: encrypted.contentEncryptionAlgorithm,
        contentNonce: encrypted.contentNonce,
        ciphertext: encrypted.ciphertext,
        ciphertextSha256: encrypted.ciphertextSha256,
        dataKeyAlgorithm: encrypted.dataKeyAlgorithm,
        dataKeyAuthTag: encrypted.dataKeyAuthTag,
        dataKeyNonce: encrypted.dataKeyNonce,
        encryptedDataKey: encrypted.encryptedDataKey,
        expiresAtMs: toUnixMilliseconds(input.expiresAt.getTime()),
        id: input.id,
        keyRef: encrypted.keyRef,
        kind: input.kind,
      },
      input.context,
    );
  }
}
