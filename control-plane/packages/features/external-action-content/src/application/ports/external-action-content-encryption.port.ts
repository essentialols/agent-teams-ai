export type ExternalActionContentEncryptedEnvelope = Readonly<{
  ciphertext: Uint8Array;
  encryptedDataKey: Uint8Array;
  contentNonce: Uint8Array;
  contentAuthTag: Uint8Array;
  dataKeyNonce: Uint8Array;
  dataKeyAuthTag: Uint8Array;
  ciphertextSha256: string;
  keyRef: string;
  dataKeyAlgorithm: string;
  contentEncryptionAlgorithm: string;
}>;

export interface ExternalActionContentEncryptionPort {
  encrypt(plaintext: Uint8Array): Promise<ExternalActionContentEncryptedEnvelope>;
  decrypt(
    envelope: ExternalActionContentEncryptedEnvelope,
  ): Promise<Readonly<{ plaintext: Uint8Array }>>;
}
