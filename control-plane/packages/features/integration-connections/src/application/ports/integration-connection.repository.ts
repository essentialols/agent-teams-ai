import type {
  DesktopClientId,
  IntegrationConnectionId,
  UnixMilliseconds,
  WorkspaceId,
} from "@agent-teams-control-plane/shared";

import type {
  IntegrationConnection,
  ProviderAccountSnapshot,
  ProviderRepositoryAvailability,
  RepositorySyncStatus,
} from "../../domain/integration-connection.js";
import type { TransactionContext } from "./transaction-context.js";

export type BindVerifiedInstallationInput = Readonly<{
  connectionId: IntegrationConnectionId;
  workspaceId: WorkspaceId;
  claimedByDesktopClientId: DesktopClientId;
  githubInstallationId: string;
  account: ProviderAccountSnapshot;
  repositories: readonly ProviderRepositoryAvailability[];
  repositorySyncStatus: RepositorySyncStatus;
  nowMs: UnixMilliseconds;
}>;

export interface IntegrationConnectionRepository {
  listForWorkspace(workspaceId: WorkspaceId): Promise<readonly IntegrationConnection[]>;
  bindVerifiedInstallation(
    input: BindVerifiedInstallationInput,
    context: TransactionContext,
  ): Promise<IntegrationConnection>;
}
