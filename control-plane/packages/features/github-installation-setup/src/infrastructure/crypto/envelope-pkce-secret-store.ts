import { createSafeError } from "@agent-teams-control-plane/shared";
import type {
  EncryptedEnvelope,
  EnvelopeEncryptionPort,
} from "@agent-teams-control-plane/platform-crypto";

import type {
  PkceSecretStore,
  StoredPkceVerifier,
} from "../../application/ports/pkce-secret-store.js";

export class EnvelopePkceSecretStore implements PkceSecretStore {
  public constructor(private readonly envelopeEncryption: EnvelopeEncryptionPort) {}

  public async encryptVerifier(verifier: string): Promise<StoredPkceVerifier> {
    const envelope = await this.envelopeEncryption.encrypt(Buffer.from(verifier, "utf8"));
    return serializeEnvelope(envelope);
  }

  public async decryptVerifier(stored: StoredPkceVerifier): Promise<string> {
    const decrypted = await this.envelopeEncryption.decrypt(deserializeEnvelope(stored));
    return Buffer.from(decrypted.plaintext).toString("utf8");
  }
}

function serializeEnvelope(envelope: EncryptedEnvelope): StoredPkceVerifier {
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

function deserializeEnvelope(stored: StoredPkceVerifier): EncryptedEnvelope {
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
      code: "CONTROL_PLANE_PKCE_VERIFIER_CORRUPT",
      message: "PKCE verifier storage is invalid.",
    });
  }
}
