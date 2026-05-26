export interface WorkspaceIdentityIdGenerator {
  uuid(): string;
}

export interface WorkspaceIdentitySecretGenerator {
  secret(input: { bytes: number }): string;
  pairingCode(): string;
}
