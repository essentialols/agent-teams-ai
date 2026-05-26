import { Module } from "@nestjs/common";

import {
  CREDENTIAL_HASHER,
  ENVELOPE_ENCRYPTION,
  type EnvelopeEncryptionPort,
  type CredentialHasher as PlatformCredentialHasher,
} from "@agent-teams-control-plane/platform-crypto";
import { PlatformCryptoModule } from "@agent-teams-control-plane/platform-crypto/nest";
import {
  ControlPlaneConfigService,
  PlatformConfigModule,
} from "@agent-teams-control-plane/platform-config";
import {
  TRANSACTION_RUNNER,
  type TransactionRunner as PlatformTransactionRunner,
} from "@agent-teams-control-plane/platform-database";
import { PlatformDatabaseModule } from "@agent-teams-control-plane/platform-database/nest";

import type { CredentialHasher } from "../../application/ports/credential-hasher.port.js";
import type { DesktopTokenSecretStore } from "../../application/ports/desktop-token-secret-store.js";
import type {
  WorkspaceIdentityIdGenerator,
  WorkspaceIdentitySecretGenerator,
} from "../../application/ports/entropy.js";
import type {
  WorkspaceIdentityAbuseControlPolicy,
  WorkspaceIdentityAuditLog,
  WorkspaceIdentityFeatureGatePolicy,
} from "../../application/ports/policies.js";
import type { TransactionRunner } from "../../application/ports/transaction-runner.js";
import type { WorkspaceIdentityRepository } from "../../application/ports/workspace-identity.repository.js";
import { AuthenticateDesktopClientUseCase } from "../../application/use-cases/authenticate-desktop-client.use-case.js";
import { BootstrapWorkspaceUseCase } from "../../application/use-cases/bootstrap-workspace.use-case.js";
import { CompleteDesktopPairingUseCase } from "../../application/use-cases/complete-desktop-pairing.use-case.js";
import { RevokeDesktopClientUseCase } from "../../application/use-cases/revoke-desktop-client.use-case.js";
import { RotateDesktopClientTokenUseCase } from "../../application/use-cases/rotate-desktop-client-token.use-case.js";
import { StartDesktopPairingUseCase } from "../../application/use-cases/start-desktop-pairing.use-case.js";
import { InMemoryWorkspaceIdentityAbuseControlPolicy } from "../../infrastructure/abuse/in-memory-workspace-identity-abuse-control.policy.js";
import { ConfigWorkspaceIdentityFeatureGatePolicy } from "../../infrastructure/config/config-workspace-identity-feature-gate.policy.js";
import { EnvelopeDesktopTokenSecretStore } from "../../infrastructure/crypto/envelope-desktop-token-secret-store.js";
import { NodeWorkspaceIdentityEntropy } from "../../infrastructure/crypto/node-workspace-identity-entropy.js";
import { PrismaWorkspaceIdentityAuditLog } from "../../infrastructure/prisma/prisma-workspace-identity-audit-log.js";
import { PrismaWorkspaceIdentityRepository } from "../../infrastructure/prisma/prisma-workspace-identity.repository.js";
import { WorkspaceIdentityController } from "./workspace-identity.controller.js";
import {
  WORKSPACE_IDENTITY_ABUSE_CONTROL_POLICY,
  WORKSPACE_IDENTITY_AUDIT_LOG,
  DESKTOP_TOKEN_SECRET_STORE,
  WORKSPACE_IDENTITY_ENTROPY,
  WORKSPACE_IDENTITY_FEATURE_GATE_POLICY,
  WORKSPACE_IDENTITY_REPOSITORY,
} from "./tokens.js";

@Module({
  controllers: [WorkspaceIdentityController],
  exports: [AuthenticateDesktopClientUseCase],
  imports: [PlatformConfigModule, PlatformCryptoModule, PlatformDatabaseModule],
  providers: [
    PrismaWorkspaceIdentityRepository,
    PrismaWorkspaceIdentityAuditLog,
    {
      provide: WORKSPACE_IDENTITY_REPOSITORY,
      useExisting: PrismaWorkspaceIdentityRepository,
    },
    {
      inject: [ControlPlaneConfigService],
      provide: WORKSPACE_IDENTITY_FEATURE_GATE_POLICY,
      useFactory: (configService: ControlPlaneConfigService) =>
        new ConfigWorkspaceIdentityFeatureGatePolicy(configService),
    },
    {
      provide: WORKSPACE_IDENTITY_ABUSE_CONTROL_POLICY,
      useClass: InMemoryWorkspaceIdentityAbuseControlPolicy,
    },
    {
      inject: [ENVELOPE_ENCRYPTION],
      provide: DESKTOP_TOKEN_SECRET_STORE,
      useFactory: (envelopeEncryption: EnvelopeEncryptionPort) =>
        new EnvelopeDesktopTokenSecretStore(envelopeEncryption),
    },
    {
      provide: WORKSPACE_IDENTITY_AUDIT_LOG,
      useExisting: PrismaWorkspaceIdentityAuditLog,
    },
    {
      provide: WORKSPACE_IDENTITY_ENTROPY,
      useClass: NodeWorkspaceIdentityEntropy,
    },
    {
      inject: [WORKSPACE_IDENTITY_REPOSITORY, CREDENTIAL_HASHER],
      provide: AuthenticateDesktopClientUseCase,
      useFactory: (
        repository: WorkspaceIdentityRepository,
        credentialHasher: CredentialHasher & PlatformCredentialHasher,
      ) => new AuthenticateDesktopClientUseCase(repository, credentialHasher),
    },
    {
      inject: [
        WORKSPACE_IDENTITY_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        WORKSPACE_IDENTITY_FEATURE_GATE_POLICY,
        WORKSPACE_IDENTITY_ABUSE_CONTROL_POLICY,
        WORKSPACE_IDENTITY_AUDIT_LOG,
        WORKSPACE_IDENTITY_ENTROPY,
      ],
      provide: BootstrapWorkspaceUseCase,
      useFactory: (
        repository: WorkspaceIdentityRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: CredentialHasher & PlatformCredentialHasher,
        featureGatePolicy: WorkspaceIdentityFeatureGatePolicy,
        abuseControlPolicy: WorkspaceIdentityAbuseControlPolicy,
        auditLog: WorkspaceIdentityAuditLog,
        entropy: WorkspaceIdentityIdGenerator & WorkspaceIdentitySecretGenerator,
      ) =>
        new BootstrapWorkspaceUseCase(
          repository,
          transactionRunner,
          credentialHasher,
          featureGatePolicy,
          abuseControlPolicy,
          auditLog,
          entropy,
          entropy,
        ),
    },
    {
      inject: [
        WORKSPACE_IDENTITY_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        WORKSPACE_IDENTITY_FEATURE_GATE_POLICY,
        WORKSPACE_IDENTITY_ABUSE_CONTROL_POLICY,
        WORKSPACE_IDENTITY_AUDIT_LOG,
        WORKSPACE_IDENTITY_ENTROPY,
      ],
      provide: StartDesktopPairingUseCase,
      useFactory: (
        repository: WorkspaceIdentityRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: CredentialHasher & PlatformCredentialHasher,
        featureGatePolicy: WorkspaceIdentityFeatureGatePolicy,
        abuseControlPolicy: WorkspaceIdentityAbuseControlPolicy,
        auditLog: WorkspaceIdentityAuditLog,
        entropy: WorkspaceIdentityIdGenerator & WorkspaceIdentitySecretGenerator,
      ) =>
        new StartDesktopPairingUseCase(
          repository,
          transactionRunner,
          credentialHasher,
          featureGatePolicy,
          abuseControlPolicy,
          auditLog,
          entropy,
          entropy,
        ),
    },
    {
      inject: [
        WORKSPACE_IDENTITY_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        WORKSPACE_IDENTITY_FEATURE_GATE_POLICY,
        WORKSPACE_IDENTITY_ABUSE_CONTROL_POLICY,
        WORKSPACE_IDENTITY_AUDIT_LOG,
        WORKSPACE_IDENTITY_ENTROPY,
      ],
      provide: CompleteDesktopPairingUseCase,
      useFactory: (
        repository: WorkspaceIdentityRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: CredentialHasher & PlatformCredentialHasher,
        featureGatePolicy: WorkspaceIdentityFeatureGatePolicy,
        abuseControlPolicy: WorkspaceIdentityAbuseControlPolicy,
        auditLog: WorkspaceIdentityAuditLog,
        entropy: WorkspaceIdentityIdGenerator & WorkspaceIdentitySecretGenerator,
      ) =>
        new CompleteDesktopPairingUseCase(
          repository,
          transactionRunner,
          credentialHasher,
          featureGatePolicy,
          abuseControlPolicy,
          auditLog,
          entropy,
          entropy,
        ),
    },
    {
      inject: [
        WORKSPACE_IDENTITY_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        DESKTOP_TOKEN_SECRET_STORE,
        WORKSPACE_IDENTITY_AUDIT_LOG,
        WORKSPACE_IDENTITY_ENTROPY,
      ],
      provide: RotateDesktopClientTokenUseCase,
      useFactory: (
        repository: WorkspaceIdentityRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: CredentialHasher & PlatformCredentialHasher,
        desktopTokenSecretStore: DesktopTokenSecretStore,
        auditLog: WorkspaceIdentityAuditLog,
        entropy: WorkspaceIdentityIdGenerator & WorkspaceIdentitySecretGenerator,
      ) =>
        new RotateDesktopClientTokenUseCase(
          repository,
          transactionRunner,
          credentialHasher,
          desktopTokenSecretStore,
          auditLog,
          entropy,
          entropy,
        ),
    },
    {
      inject: [
        WORKSPACE_IDENTITY_REPOSITORY,
        TRANSACTION_RUNNER,
        WORKSPACE_IDENTITY_AUDIT_LOG,
      ],
      provide: RevokeDesktopClientUseCase,
      useFactory: (
        repository: WorkspaceIdentityRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        auditLog: WorkspaceIdentityAuditLog,
      ) => new RevokeDesktopClientUseCase(repository, transactionRunner, auditLog),
    },
  ],
})
export class WorkspaceIdentityModule {}
