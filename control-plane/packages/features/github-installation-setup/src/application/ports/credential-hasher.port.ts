export type GitHubCredentialHashPurpose =
  | "github-setup-state"
  | "github-claim-continuation"
  | "github-oauth-state";

export interface GitHubCredentialHasher {
  hash(input: {
    purpose: GitHubCredentialHashPurpose;
    credential: string;
  }): Promise<{ value: string }>;
  verify(input: {
    purpose: GitHubCredentialHashPurpose;
    credential: string;
    expectedHash: string;
  }): Promise<boolean>;
}
