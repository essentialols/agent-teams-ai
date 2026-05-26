export type StoredPkceVerifier = Readonly<{
  ciphertext: string;
  encryptedDataKey: string;
  contentNonce: string;
  contentAuthTag: string;
  dataKeyNonce: string;
  dataKeyAuthTag: string;
  ciphertextSha256: string;
  keyRef: string;
  dataKeyAlgorithm: "AES-256-GCM";
  contentEncryptionAlgorithm: "AES-256-GCM";
}>;

export interface PkceSecretStore {
  encryptVerifier(verifier: string): Promise<StoredPkceVerifier>;
  decryptVerifier(stored: StoredPkceVerifier): Promise<string>;
}
