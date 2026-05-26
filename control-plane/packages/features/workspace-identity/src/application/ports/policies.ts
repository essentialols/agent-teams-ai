import type { SafeError } from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "../../domain/workspace-identity.js";

export type WorkspaceIdentityFeature = "desktop-bootstrap" | "desktop-pairing";
export type WorkspaceIdentityAbuseAction =
  | "workspace-bootstrap"
  | "pairing-start"
  | "pairing-complete";

export interface WorkspaceIdentityFeatureGatePolicy {
  assertEnabled(feature: WorkspaceIdentityFeature): Promise<void>;
}

export interface WorkspaceIdentityAbuseControlPolicy {
  assertAllowed(input: {
    action: WorkspaceIdentityAbuseAction;
    actor?: DesktopClientActor;
    key?: string;
  }): Promise<void>;
}

export interface WorkspaceIdentityAuditLog {
  record(input: {
    eventType: string;
    actor?: DesktopClientActor;
    workspaceId?: string;
    subjectKind?: string;
    subjectId?: string;
    safeMetadata?: Readonly<Record<string, boolean | number | string | null>>;
  }): Promise<void>;
}

export function disabledFeatureError(feature: WorkspaceIdentityFeature): SafeError {
  return {
    category: "authorization",
    code: "CONTROL_PLANE_FEATURE_DISABLED" as SafeError["code"],
    message: "Control-plane feature is disabled.",
    retryable: false,
    safeDetails: { feature },
  };
}
