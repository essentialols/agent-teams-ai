import { Module } from "@nestjs/common";

import { WorkspaceIdentityModule } from "@agent-teams-control-plane/features-workspace-identity/interface/nest";
import {
  ControlPlaneConfigService,
  PlatformConfigModule,
} from "@agent-teams-control-plane/platform-config";
import { PlatformDatabaseModule } from "@agent-teams-control-plane/platform-database/nest";

import type { GitHubAppJwtSigner } from "../../application/ports/github-app-jwt-signer.port.js";
import type { GitHubInstallationTokenIssuer } from "../../application/ports/github-installation-token-issuer.port.js";
import type {
  GitHubTokenBrokerAbuseControlPolicy,
  GitHubTokenBrokerAuditLog,
  GitHubTokenBrokerFeatureGatePolicy,
  GitHubTokenBrokerSettings,
} from "../../application/ports/policies.js";
import type { GitHubTokenTargetAuthorizationPort } from "../../application/ports/target-authorization.port.js";
import { CheckGitHubTokenBrokerReadinessUseCase } from "../../application/use-cases/check-github-token-broker-readiness.use-case.js";
import { DryRunGitHubTokenScopeUseCase } from "../../application/use-cases/dry-run-github-token-scope.use-case.js";
import { IssueGitHubInstallationTokenUseCase } from "../../application/use-cases/issue-github-installation-token.use-case.js";
import { InMemoryGitHubTokenBrokerAbuseControlPolicy } from "../../infrastructure/abuse/in-memory-github-token-broker-abuse-control.policy.js";
import {
  ConfigGitHubTokenBrokerFeatureGatePolicy,
  ConfigGitHubTokenBrokerSettings,
} from "../../infrastructure/config/config-github-token-broker.policy.js";
import { GitHubRestInstallationTokenIssuer } from "../../infrastructure/github/github-rest-installation-token.issuer.js";
import { NodeGitHubAppJwtSigner } from "../../infrastructure/github/node-github-app-jwt-signer.js";
import { PrismaGitHubTokenBrokerAuditLog } from "../../infrastructure/prisma/prisma-github-token-broker-audit-log.js";
import { PrismaGitHubTokenTargetAuthorizationPort } from "../../infrastructure/prisma/prisma-github-token-target-authorization.port.js";
import { GitHubTokenBrokerController } from "./github-token-broker.controller.js";
import {
  GITHUB_APP_JWT_SIGNER,
  GITHUB_INSTALLATION_TOKEN_ISSUER,
  GITHUB_TOKEN_BROKER_ABUSE_CONTROL,
  GITHUB_TOKEN_BROKER_AUDIT_LOG,
  GITHUB_TOKEN_BROKER_FEATURE_GATE_POLICY,
  GITHUB_TOKEN_BROKER_SETTINGS,
  GITHUB_TOKEN_TARGET_AUTHORIZATION,
} from "./tokens.js";

@Module({
  controllers: [GitHubTokenBrokerController],
  exports: [IssueGitHubInstallationTokenUseCase],
  imports: [PlatformConfigModule, PlatformDatabaseModule, WorkspaceIdentityModule],
  providers: [
    PrismaGitHubTokenBrokerAuditLog,
    PrismaGitHubTokenTargetAuthorizationPort,
    InMemoryGitHubTokenBrokerAbuseControlPolicy,
    {
      inject: [ControlPlaneConfigService],
      provide: GITHUB_TOKEN_BROKER_FEATURE_GATE_POLICY,
      useFactory: (configService: ControlPlaneConfigService) =>
        new ConfigGitHubTokenBrokerFeatureGatePolicy(configService),
    },
    {
      inject: [ControlPlaneConfigService],
      provide: GITHUB_TOKEN_BROKER_SETTINGS,
      useFactory: (configService: ControlPlaneConfigService) =>
        new ConfigGitHubTokenBrokerSettings(configService),
    },
    {
      inject: [GITHUB_TOKEN_BROKER_SETTINGS],
      provide: GITHUB_APP_JWT_SIGNER,
      useFactory: (settings: GitHubTokenBrokerSettings) =>
        new NodeGitHubAppJwtSigner(settings),
    },
    {
      inject: [GITHUB_TOKEN_BROKER_SETTINGS, GITHUB_APP_JWT_SIGNER],
      provide: GITHUB_INSTALLATION_TOKEN_ISSUER,
      useFactory: (settings: GitHubTokenBrokerSettings, signer: GitHubAppJwtSigner) =>
        new GitHubRestInstallationTokenIssuer(settings, signer),
    },
    {
      provide: GITHUB_TOKEN_TARGET_AUTHORIZATION,
      useExisting: PrismaGitHubTokenTargetAuthorizationPort,
    },
    {
      provide: GITHUB_TOKEN_BROKER_AUDIT_LOG,
      useExisting: PrismaGitHubTokenBrokerAuditLog,
    },
    {
      provide: GITHUB_TOKEN_BROKER_ABUSE_CONTROL,
      useExisting: InMemoryGitHubTokenBrokerAbuseControlPolicy,
    },
    {
      inject: [
        GITHUB_TOKEN_BROKER_FEATURE_GATE_POLICY,
        GITHUB_TOKEN_TARGET_AUTHORIZATION,
      ],
      provide: DryRunGitHubTokenScopeUseCase,
      useFactory: (
        featureGate: GitHubTokenBrokerFeatureGatePolicy,
        targetAuthorization: GitHubTokenTargetAuthorizationPort,
      ) => new DryRunGitHubTokenScopeUseCase(featureGate, targetAuthorization),
    },
    {
      inject: [
        GITHUB_TOKEN_BROKER_FEATURE_GATE_POLICY,
        GITHUB_TOKEN_BROKER_SETTINGS,
        GITHUB_APP_JWT_SIGNER,
      ],
      provide: CheckGitHubTokenBrokerReadinessUseCase,
      useFactory: (
        featureGate: GitHubTokenBrokerFeatureGatePolicy,
        settings: GitHubTokenBrokerSettings,
        signer: GitHubAppJwtSigner,
      ) => new CheckGitHubTokenBrokerReadinessUseCase(featureGate, settings, signer),
    },
    {
      inject: [
        GITHUB_TOKEN_BROKER_FEATURE_GATE_POLICY,
        GITHUB_TOKEN_TARGET_AUTHORIZATION,
        GITHUB_TOKEN_BROKER_ABUSE_CONTROL,
        GITHUB_INSTALLATION_TOKEN_ISSUER,
        GITHUB_TOKEN_BROKER_AUDIT_LOG,
      ],
      provide: IssueGitHubInstallationTokenUseCase,
      useFactory: (
        featureGate: GitHubTokenBrokerFeatureGatePolicy,
        targetAuthorization: GitHubTokenTargetAuthorizationPort,
        abuseControl: GitHubTokenBrokerAbuseControlPolicy,
        tokenIssuer: GitHubInstallationTokenIssuer,
        auditLog: GitHubTokenBrokerAuditLog,
      ) =>
        new IssueGitHubInstallationTokenUseCase(
          featureGate,
          targetAuthorization,
          abuseControl,
          tokenIssuer,
          auditLog,
        ),
    },
  ],
})
export class GitHubTokenBrokerModule {}
