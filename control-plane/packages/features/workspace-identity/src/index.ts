export {
  type DesktopClient,
  type DesktopClientActor,
  type DesktopClientCredential,
  type DesktopClientStatus,
  type DesktopCredentialStatus,
  type DesktopPairingSession,
  type DesktopPairingSessionStatus,
  type Workspace,
  type WorkspaceStatus,
} from "./domain/index.js";
export { AuthenticateDesktopClientUseCase } from "./application/use-cases/authenticate-desktop-client.use-case.js";
export { BootstrapWorkspaceUseCase } from "./application/use-cases/bootstrap-workspace.use-case.js";
export { CompleteDesktopPairingUseCase } from "./application/use-cases/complete-desktop-pairing.use-case.js";
export { RevokeDesktopClientUseCase } from "./application/use-cases/revoke-desktop-client.use-case.js";
export { RotateDesktopClientTokenUseCase } from "./application/use-cases/rotate-desktop-client-token.use-case.js";
export { StartDesktopPairingUseCase } from "./application/use-cases/start-desktop-pairing.use-case.js";
export {
  type CredentialHasher,
  type CredentialHashPurpose,
} from "./application/ports/credential-hasher.port.js";
export {
  type WorkspaceIdentityAbuseControlPolicy,
  type WorkspaceIdentityAuditLog,
  type WorkspaceIdentityFeature,
  type WorkspaceIdentityFeatureGatePolicy,
} from "./application/ports/policies.js";
