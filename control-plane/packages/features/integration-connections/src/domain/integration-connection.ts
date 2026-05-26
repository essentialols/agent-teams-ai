import type {
  DesktopClientId,
  IntegrationConnectionId,
  UnixMilliseconds,
  WorkspaceId,
} from "@agent-teams-control-plane/shared";

export type IntegrationProvider = "github";
export type ProviderConnectionKind = "app_installation";
export type IntegrationConnectionStatus = "active" | "suspended" | "deleted";

export type ProviderAccountSnapshot = Readonly<{
  providerAccountId: string;
  providerAccountKind: "User" | "Organization";
  displayLogin: string;
  avatarUrl?: string;
  lastVerifiedAtMs: UnixMilliseconds;
}>;

export type ProviderRepositoryAvailability = Readonly<{
  providerRepositoryId: string;
  displayOwner: string;
  displayName: string;
  displayFullName: string;
  private: boolean;
  archived: boolean;
  available: boolean;
  lastVerifiedAtMs: UnixMilliseconds;
}>;

export type RepositorySyncStatus = Readonly<{
  complete: boolean;
  nextCursor?: string;
}>;

export type IntegrationConnection = Readonly<{
  id: IntegrationConnectionId;
  workspaceId: WorkspaceId;
  provider: IntegrationProvider;
  providerConnectionKind: ProviderConnectionKind;
  providerInstallationId: string;
  status: IntegrationConnectionStatus;
  claimedByDesktopClientId?: DesktopClientId;
  repositorySyncStatus: RepositorySyncStatus;
  account?: ProviderAccountSnapshot;
  repositoryCount: number;
  createdAtMs: UnixMilliseconds;
  updatedAtMs: UnixMilliseconds;
}>;
