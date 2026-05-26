import { createSafeError } from "@agent-teams-control-plane/shared";

export type GitHubTokenBrokerFeature = "github-token-broker";

export interface GitHubTokenBrokerFeatureGatePolicy {
  assertEnabled(feature: GitHubTokenBrokerFeature): Promise<void>;
  isEnabled(feature: GitHubTokenBrokerFeature): boolean;
}

export type GitHubTokenBrokerReadinessSnapshot = Readonly<{
  mode: string;
  publicBaseUrlConfigured: boolean;
  appIdConfigured: boolean;
  appClientIdConfigured: boolean;
  appSlugConfigured: boolean;
  restApiVersionConfigured: boolean;
  privateKeyConfigured: boolean;
}>;

export interface GitHubTokenBrokerSettings {
  appJwtIssuer(): string | undefined;
  privateKey(): string | undefined;
  restApiVersion(): string | undefined;
  readinessSnapshot(): GitHubTokenBrokerReadinessSnapshot;
}

export interface GitHubTokenBrokerAuditLog {
  record(input: {
    eventType: string;
    workspaceId?: string;
    integrationTargetId?: string;
    githubInstallationId?: string;
    capability?: string;
    repositoryCount?: number;
    permissionSummary?: Readonly<Record<string, string>>;
    status: "allowed" | "denied" | "failed";
    safeErrorCode?: string;
    correlationId?: string;
  }): Promise<void>;
}

export interface GitHubTokenBrokerAbuseControlPolicy {
  assertAllowed(input: {
    workspaceId: string;
    githubInstallationId: string;
    capability: string;
  }): Promise<void>;
}

export function githubTokenBrokerFeatureDisabledError(feature: GitHubTokenBrokerFeature) {
  return createSafeError({
    category: "authorization",
    code: "CONTROL_PLANE_FEATURE_DISABLED",
    message: "Control-plane feature is disabled.",
    safeDetails: { feature },
  });
}
