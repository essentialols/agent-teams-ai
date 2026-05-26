import type { SafeError } from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "@agent-teams-control-plane/features-workspace-identity";

export type GitHubSetupFeature =
  | "github-setup"
  | "github-claim-oauth"
  | "github-unclaimed-callback-recording";
export type GitHubSetupAbuseAction =
  | "github-setup-start"
  | "github-setup-callback"
  | "github-claim-start"
  | "github-oauth-callback";

export interface GitHubSetupFeatureGatePolicy {
  assertEnabled(feature: GitHubSetupFeature): Promise<void>;
  isEnabled(feature: GitHubSetupFeature): boolean;
}

export interface GitHubSetupAbuseControlPolicy {
  assertAllowed(input: {
    action: GitHubSetupAbuseAction;
    actor?: DesktopClientActor;
    key?: string;
  }): Promise<void>;
}

export interface GitHubSetupAuditLog {
  record(input: {
    eventType: string;
    actor?: DesktopClientActor;
    workspaceId?: string;
    subjectKind?: string;
    subjectId?: string;
    safeMetadata?: Readonly<Record<string, boolean | number | string | null>>;
  }): Promise<void>;
}

export function githubFeatureDisabledError(feature: GitHubSetupFeature): SafeError {
  return {
    category: "authorization",
    code: "CONTROL_PLANE_FEATURE_DISABLED" as SafeError["code"],
    message: "Control-plane feature is disabled.",
    retryable: false,
    safeDetails: { feature },
  };
}
