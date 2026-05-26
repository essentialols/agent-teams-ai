export type StoredDesktopToken = Readonly<{
  ciphertext: string;
  ciphertextSha256: string;
  contentAuthTag: string;
  contentEncryptionAlgorithm: "AES-256-GCM";
  contentNonce: string;
  dataKeyAlgorithm: "AES-256-GCM";
  dataKeyAuthTag: string;
  dataKeyNonce: string;
  encryptedDataKey: string;
  keyRef: string;
}>;

export interface DesktopTokenSecretStore {
  encryptToken(token: string): Promise<StoredDesktopToken>;
  decryptToken(stored: StoredDesktopToken): Promise<string>;
}
