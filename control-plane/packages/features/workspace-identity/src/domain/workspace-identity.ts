import type {
  DesktopClientId,
  UnixMilliseconds,
  WorkspaceId,
} from "@agent-teams-control-plane/shared";

export type WorkspaceStatus = "active" | "disabled" | "pending_cleanup" | "deleted";
export type DesktopClientStatus = "active" | "rotating" | "revoked" | "expired";
export type DesktopCredentialStatus = "active" | "revoked" | "expired";
export type DesktopPairingSessionStatus =
  | "created"
  | "consumed"
  | "expired"
  | "cancelled";

export type DesktopClientActor = Readonly<{
  workspaceId: WorkspaceId;
  desktopClientId: DesktopClientId;
  credentialId: string;
}>;

export type Workspace = Readonly<{
  id: WorkspaceId;
  displayName: string;
  status: WorkspaceStatus;
  createdAtMs: UnixMilliseconds;
  updatedAtMs: UnixMilliseconds;
}>;

export type DesktopClient = Readonly<{
  id: DesktopClientId;
  workspaceId: WorkspaceId;
  displayName: string;
  status: DesktopClientStatus;
  createdAtMs: UnixMilliseconds;
  lastSeenAtMs?: UnixMilliseconds;
  revokedAtMs?: UnixMilliseconds;
}>;

export type DesktopClientCredential = Readonly<{
  id: string;
  desktopClientId: DesktopClientId;
  tokenHash: string;
  lookupPrefix: string;
  tokenVersion: number;
  status: DesktopCredentialStatus;
  createdAtMs: UnixMilliseconds;
  expiresAtMs?: UnixMilliseconds;
  revokedAtMs?: UnixMilliseconds;
  lastUsedAtMs?: UnixMilliseconds;
}>;

export type DesktopPairingSession = Readonly<{
  id: string;
  workspaceId: WorkspaceId;
  requestedByDesktopClientId: DesktopClientId;
  pairingCodeHash: string;
  status: DesktopPairingSessionStatus;
  attemptCount: number;
  maxAttempts: number;
  expiresAtMs: UnixMilliseconds;
  createdAtMs: UnixMilliseconds;
  consumedAtMs?: UnixMilliseconds;
  consumedByDesktopClientId?: DesktopClientId;
}>;
