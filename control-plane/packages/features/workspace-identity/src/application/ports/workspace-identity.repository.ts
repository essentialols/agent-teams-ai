import type {
  DesktopClientId,
  UnixMilliseconds,
  WorkspaceId,
} from "@agent-teams-control-plane/shared";

import type {
  DesktopClient,
  DesktopClientActor,
  DesktopClientCredential,
  Workspace,
} from "../../domain/workspace-identity.js";
import type { StoredDesktopToken } from "./desktop-token-secret-store.js";
import type { TransactionContext } from "./transaction-runner.js";

export type BootstrapWorkspaceInput = Readonly<{
  workspace: Workspace;
  desktopClient: DesktopClient;
  credential: DesktopClientCredential;
}>;

export type DesktopCredentialLookup = Readonly<{
  credential: DesktopClientCredential;
  client: DesktopClient;
  workspace: Workspace;
}>;

export type PairingCompletionInput = Readonly<{
  pairingCodeHash: string;
  desktopClient: DesktopClient;
  credential: DesktopClientCredential;
  nowMs: UnixMilliseconds;
}>;

export type PairingCompletionResult =
  | Readonly<{
      kind: "completed";
      workspaceId: WorkspaceId;
      desktopClientId: DesktopClientId;
    }>
  | Readonly<{ kind: "rejected" }>;

export type DesktopCredentialRotationResult =
  | Readonly<{ kind: "created" }>
  | Readonly<{
      kind: "already-completed";
      desktopToken: StoredDesktopToken;
    }>;

export interface WorkspaceIdentityRepository {
  createBootstrapWorkspace(
    input: BootstrapWorkspaceInput,
    context: TransactionContext,
  ): Promise<void>;
  findCredentialByLookupPrefix(
    lookupPrefix: string,
  ): Promise<DesktopCredentialLookup | undefined>;
  markCredentialUsed(input: {
    credentialId: string;
    desktopClientId: DesktopClientId;
    nowMs: UnixMilliseconds;
  }): Promise<void>;
  rotateCredential(
    input: {
      actor: DesktopClientActor;
      newCredential: DesktopClientCredential;
      rotationRequestId: string;
      desktopToken: StoredDesktopToken;
      nowMs: UnixMilliseconds;
    },
    context: TransactionContext,
  ): Promise<DesktopCredentialRotationResult>;
  revokeDesktopClient(
    input: {
      actor: DesktopClientActor;
      desktopClientId: DesktopClientId;
      nowMs: UnixMilliseconds;
    },
    context: TransactionContext,
  ): Promise<void>;
  createPairingSession(
    input: {
      id: string;
      actor: DesktopClientActor;
      pairingCodeHash: string;
      expiresAtMs: UnixMilliseconds;
      nowMs: UnixMilliseconds;
      maxAttempts: number;
    },
    context: TransactionContext,
  ): Promise<void>;
  completePairing(
    input: PairingCompletionInput,
    context: TransactionContext,
  ): Promise<PairingCompletionResult>;
}
