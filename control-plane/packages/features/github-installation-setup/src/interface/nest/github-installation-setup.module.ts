import { Module } from "@nestjs/common";

import {
  INTEGRATION_CONNECTION_REPOSITORY,
  IntegrationConnectionsModule,
} from "@agent-teams-control-plane/features-integration-connections/interface/nest";
import type { IntegrationConnectionRepository } from "@agent-teams-control-plane/features-integration-connections";
import { WorkspaceIdentityModule } from "@agent-teams-control-plane/features-workspace-identity/interface/nest";
import {
  CREDENTIAL_HASHER,
  ENVELOPE_ENCRYPTION,
  type CredentialHasher as PlatformCredentialHasher,
  type EnvelopeEncryptionPort,
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

import type { GitHubCredentialHasher } from "../../application/ports/credential-hasher.port.js";
import type {
  GitHubSetupIdGenerator,
  GitHubSetupSecretGenerator,
} from "../../application/ports/entropy.js";
import type { GitHubAppSetupSettings } from "../../application/ports/github-app-settings.js";
import type { GitHubClaimAuthorityVerifier } from "../../application/ports/github-claim-authority-verifier.port.js";
import type { GitHubUserTokenExchange } from "../../application/ports/github-oauth.port.js";
import type { GitHubSetupRepository } from "../../application/ports/github-setup.repository.js";
import type { PkceSecretStore } from "../../application/ports/pkce-secret-store.js";
import type {
  GitHubSetupAbuseControlPolicy,
  GitHubSetupAuditLog,
  GitHubSetupFeatureGatePolicy,
} from "../../application/ports/policies.js";
import type { TransactionRunner } from "../../application/ports/transaction-runner.js";
import { CompleteGitHubClaimOAuthUseCase } from "../../application/use-cases/complete-github-claim-oauth.use-case.js";
import { GetGitHubSetupStatusUseCase } from "../../application/use-cases/get-github-setup-status.use-case.js";
import { HandleGitHubSetupCallbackUseCase } from "../../application/use-cases/handle-github-setup-callback.use-case.js";
import { StartGitHubClaimOAuthUseCase } from "../../application/use-cases/start-github-claim-oauth.use-case.js";
import { StartGitHubInstallationSetupUseCase } from "../../application/use-cases/start-github-installation-setup.use-case.js";
import { InMemoryGitHubSetupAbuseControlPolicy } from "../../infrastructure/abuse/in-memory-github-setup-abuse-control.policy.js";
import {
  ConfigGitHubAppSetupSettings,
  ConfigGitHubSetupFeatureGatePolicy,
} from "../../infrastructure/config/config-github-setup-settings.js";
import { EnvelopePkceSecretStore } from "../../infrastructure/crypto/envelope-pkce-secret-store.js";
import { NodeGitHubSetupEntropy } from "../../infrastructure/crypto/node-github-setup-entropy.js";
import { GitHubOAuthHttpUserTokenExchange } from "../../infrastructure/github/github-oauth-http-user-token.exchange.js";
import { GitHubRestClaimAuthorityVerifier } from "../../infrastructure/github/github-rest-claim-authority.verifier.js";
import { PrismaGitHubSetupAuditLog } from "../../infrastructure/prisma/prisma-github-setup-audit-log.js";
import { PrismaGitHubSetupRepository } from "../../infrastructure/prisma/prisma-github-setup.repository.js";
import { GitHubInstallationSetupController } from "./github-installation-setup.controller.js";
import {
  GITHUB_APP_SETUP_SETTINGS,
  GITHUB_CLAIM_AUTHORITY_VERIFIER,
  GITHUB_SETUP_ABUSE_CONTROL_POLICY,
  GITHUB_SETUP_AUDIT_LOG,
  GITHUB_SETUP_ENTROPY,
  GITHUB_SETUP_FEATURE_GATE_POLICY,
  GITHUB_SETUP_REPOSITORY,
  GITHUB_USER_TOKEN_EXCHANGE,
  PKCE_SECRET_STORE,
} from "./tokens.js";

@Module({
  controllers: [GitHubInstallationSetupController],
  imports: [
    IntegrationConnectionsModule,
    PlatformConfigModule,
    PlatformCryptoModule,
    PlatformDatabaseModule,
    WorkspaceIdentityModule,
  ],
  providers: [
    PrismaGitHubSetupRepository,
    PrismaGitHubSetupAuditLog,
    {
      provide: GITHUB_SETUP_REPOSITORY,
      useExisting: PrismaGitHubSetupRepository,
    },
    {
      inject: [ControlPlaneConfigService],
      provide: GITHUB_APP_SETUP_SETTINGS,
      useFactory: (configService: ControlPlaneConfigService) =>
        new ConfigGitHubAppSetupSettings(configService),
    },
    {
      inject: [ControlPlaneConfigService],
      provide: GITHUB_SETUP_FEATURE_GATE_POLICY,
      useFactory: (configService: ControlPlaneConfigService) =>
        new ConfigGitHubSetupFeatureGatePolicy(configService),
    },
    {
      provide: GITHUB_SETUP_ABUSE_CONTROL_POLICY,
      useClass: InMemoryGitHubSetupAbuseControlPolicy,
    },
    {
      provide: GITHUB_SETUP_AUDIT_LOG,
      useExisting: PrismaGitHubSetupAuditLog,
    },
    {
      provide: GITHUB_SETUP_ENTROPY,
      useClass: NodeGitHubSetupEntropy,
    },
    {
      inject: [ENVELOPE_ENCRYPTION],
      provide: PKCE_SECRET_STORE,
      useFactory: (envelopeEncryption: EnvelopeEncryptionPort) =>
        new EnvelopePkceSecretStore(envelopeEncryption),
    },
    {
      inject: [GITHUB_APP_SETUP_SETTINGS],
      provide: GITHUB_USER_TOKEN_EXCHANGE,
      useFactory: (settings: GitHubAppSetupSettings) =>
        new GitHubOAuthHttpUserTokenExchange(settings),
    },
    {
      inject: [GITHUB_APP_SETUP_SETTINGS],
      provide: GITHUB_CLAIM_AUTHORITY_VERIFIER,
      useFactory: (settings: GitHubAppSetupSettings) =>
        new GitHubRestClaimAuthorityVerifier(settings),
    },
    {
      inject: [
        GITHUB_SETUP_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        GITHUB_SETUP_FEATURE_GATE_POLICY,
        GITHUB_SETUP_ABUSE_CONTROL_POLICY,
        GITHUB_SETUP_AUDIT_LOG,
        GITHUB_APP_SETUP_SETTINGS,
        GITHUB_SETUP_ENTROPY,
      ],
      provide: StartGitHubInstallationSetupUseCase,
      useFactory: (
        repository: GitHubSetupRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: GitHubCredentialHasher & PlatformCredentialHasher,
        featureGatePolicy: GitHubSetupFeatureGatePolicy,
        abuseControlPolicy: GitHubSetupAbuseControlPolicy,
        auditLog: GitHubSetupAuditLog,
        settings: GitHubAppSetupSettings,
        entropy: GitHubSetupIdGenerator & GitHubSetupSecretGenerator,
      ) =>
        new StartGitHubInstallationSetupUseCase(
          repository,
          transactionRunner,
          credentialHasher,
          featureGatePolicy,
          abuseControlPolicy,
          auditLog,
          settings,
          entropy,
          entropy,
        ),
    },
    {
      inject: [
        GITHUB_SETUP_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        GITHUB_SETUP_FEATURE_GATE_POLICY,
        GITHUB_SETUP_ABUSE_CONTROL_POLICY,
        GITHUB_SETUP_AUDIT_LOG,
        GITHUB_SETUP_ENTROPY,
      ],
      provide: HandleGitHubSetupCallbackUseCase,
      useFactory: (
        repository: GitHubSetupRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: GitHubCredentialHasher & PlatformCredentialHasher,
        featureGatePolicy: GitHubSetupFeatureGatePolicy,
        abuseControlPolicy: GitHubSetupAbuseControlPolicy,
        auditLog: GitHubSetupAuditLog,
        entropy: GitHubSetupIdGenerator & GitHubSetupSecretGenerator,
      ) =>
        new HandleGitHubSetupCallbackUseCase(
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
        GITHUB_SETUP_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        PKCE_SECRET_STORE,
        GITHUB_SETUP_FEATURE_GATE_POLICY,
        GITHUB_SETUP_ABUSE_CONTROL_POLICY,
        GITHUB_SETUP_AUDIT_LOG,
        GITHUB_APP_SETUP_SETTINGS,
        GITHUB_SETUP_ENTROPY,
      ],
      provide: StartGitHubClaimOAuthUseCase,
      useFactory: (
        repository: GitHubSetupRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: GitHubCredentialHasher & PlatformCredentialHasher,
        pkceSecretStore: PkceSecretStore,
        featureGatePolicy: GitHubSetupFeatureGatePolicy,
        abuseControlPolicy: GitHubSetupAbuseControlPolicy,
        auditLog: GitHubSetupAuditLog,
        settings: GitHubAppSetupSettings,
        entropy: GitHubSetupIdGenerator & GitHubSetupSecretGenerator,
      ) =>
        new StartGitHubClaimOAuthUseCase(
          repository,
          transactionRunner,
          credentialHasher,
          pkceSecretStore,
          featureGatePolicy,
          abuseControlPolicy,
          auditLog,
          settings,
          entropy,
          entropy,
        ),
    },
    {
      inject: [
        GITHUB_SETUP_REPOSITORY,
        INTEGRATION_CONNECTION_REPOSITORY,
        TRANSACTION_RUNNER,
        CREDENTIAL_HASHER,
        PKCE_SECRET_STORE,
        GITHUB_USER_TOKEN_EXCHANGE,
        GITHUB_CLAIM_AUTHORITY_VERIFIER,
        GITHUB_SETUP_ABUSE_CONTROL_POLICY,
        GITHUB_SETUP_AUDIT_LOG,
        GITHUB_SETUP_ENTROPY,
      ],
      provide: CompleteGitHubClaimOAuthUseCase,
      useFactory: (
        repository: GitHubSetupRepository,
        integrationConnections: IntegrationConnectionRepository,
        transactionRunner: TransactionRunner & PlatformTransactionRunner,
        credentialHasher: GitHubCredentialHasher & PlatformCredentialHasher,
        pkceSecretStore: PkceSecretStore,
        tokenExchange: GitHubUserTokenExchange,
        authorityVerifier: GitHubClaimAuthorityVerifier,
        abuseControlPolicy: GitHubSetupAbuseControlPolicy,
        auditLog: GitHubSetupAuditLog,
        entropy: GitHubSetupIdGenerator,
      ) =>
        new CompleteGitHubClaimOAuthUseCase(
          repository,
          integrationConnections,
          transactionRunner,
          credentialHasher,
          pkceSecretStore,
          tokenExchange,
          authorityVerifier,
          abuseControlPolicy,
          auditLog,
          entropy,
        ),
    },
    {
      inject: [GITHUB_SETUP_REPOSITORY],
      provide: GetGitHubSetupStatusUseCase,
      useFactory: (repository: GitHubSetupRepository) =>
        new GetGitHubSetupStatusUseCase(repository),
    },
  ],
})
export class GitHubInstallationSetupModule {}
