export interface GitHubSetupIdGenerator {
  uuid(): string;
}

export interface GitHubSetupSecretGenerator {
  secret(input: { bytes: number }): string;
}
