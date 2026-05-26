export type CredentialHashPurpose = "desktop-token" | "pairing-code";

export interface CredentialHasher {
  hash(input: {
    purpose: CredentialHashPurpose;
    credential: string;
  }): Promise<{ value: string }>;
  verify(input: {
    purpose: CredentialHashPurpose;
    credential: string;
    expectedHash: string;
  }): Promise<boolean>;
}
