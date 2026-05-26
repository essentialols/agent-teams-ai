import type { UnixMilliseconds } from "@agent-teams-control-plane/shared";

export type GitHubAppJwt = Readonly<{
  value: string;
  issuedAtMs: UnixMilliseconds;
  expiresAtMs: UnixMilliseconds;
}>;

export type GitHubAppJwtSignerReadiness = Readonly<{
  privateKeyConfigured: boolean;
  privateKeyParseable: boolean;
  safeErrorCode?: string;
}>;

export interface GitHubAppJwtSigner {
  sign(input: { nowMs: UnixMilliseconds }): Promise<GitHubAppJwt>;
  checkReadiness(): Promise<GitHubAppJwtSignerReadiness>;
}
