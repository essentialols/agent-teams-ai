import { createSafeError } from "@agent-teams-control-plane/shared";
import type {
  EncryptedEnvelope,
  EnvelopeEncryptionPort,
} from "@agent-teams-control-plane/platform-crypto";

import type {
  DesktopTokenSecretStore,
  StoredDesktopToken,
} from "../../application/ports/desktop-token-secret-store.js";

export class EnvelopeDesktopTokenSecretStore implements DesktopTokenSecretStore {
  public constructor(private readonly envelopeEncryption: EnvelopeEncryptionPort) {}

  public async encryptToken(token: string): Promise<StoredDesktopToken> {
    const envelope = await this.envelopeEncryption.encrypt(Buffer.from(token, "utf8"));
    return serializeEnvelope(envelope);
  }

  public async decryptToken(stored: StoredDesktopToken): Promise<string> {
    const decrypted = await this.envelopeEncryption.decrypt(deserializeEnvelope(stored));
    return Buffer.from(decrypted.plaintext).toString("utf8");
  }
}

function serializeEnvelope(envelope: EncryptedEnvelope): StoredDesktopToken {
  return {
    ciphertext: Buffer.from(envelope.ciphertext).toString("base64"),
    ciphertextSha256: envelope.ciphertextSha256,
    contentAuthTag: Buffer.from(envelope.contentAuthTag).toString("base64"),
    contentEncryptionAlgorithm: envelope.contentEncryptionAlgorithm,
    contentNonce: Buffer.from(envelope.contentNonce).toString("base64"),
    dataKeyAlgorithm: envelope.dataKeyAlgorithm,
    dataKeyAuthTag: Buffer.from(envelope.dataKeyAuthTag).toString("base64"),
    dataKeyNonce: Buffer.from(envelope.dataKeyNonce).toString("base64"),
    encryptedDataKey: Buffer.from(envelope.encryptedDataKey).toString("base64"),
    keyRef: envelope.keyRef,
  };
}

function deserializeEnvelope(stored: StoredDesktopToken): EncryptedEnvelope {
  try {
    return {
      ciphertext: Buffer.from(stored.ciphertext, "base64"),
      ciphertextSha256: stored.ciphertextSha256,
      contentAuthTag: Buffer.from(stored.contentAuthTag, "base64"),
      contentEncryptionAlgorithm: stored.contentEncryptionAlgorithm,
      contentNonce: Buffer.from(stored.contentNonce, "base64"),
      dataKeyAlgorithm: stored.dataKeyAlgorithm,
      dataKeyAuthTag: Buffer.from(stored.dataKeyAuthTag, "base64"),
      dataKeyNonce: Buffer.from(stored.dataKeyNonce, "base64"),
      encryptedDataKey: Buffer.from(stored.encryptedDataKey, "base64"),
      keyRef: stored.keyRef,
    };
  } catch {
    throw createSafeError({
      category: "internal",
      code: "CONTROL_PLANE_DESKTOP_TOKEN_STORAGE_CORRUPT",
      message: "Desktop token storage is invalid.",
    });
  }
}
