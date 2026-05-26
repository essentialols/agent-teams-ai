import type { TargetPolicySubjectKind } from "@agent-teams-control-plane/features-integration-targets";
import {
  normalizeTargetPolicySubjectId,
  parseIntegrationTargetId,
} from "@agent-teams-control-plane/features-integration-targets";
import {
  parseWorkspaceId,
  SystemClock,
  type Clock,
} from "@agent-teams-control-plane/shared";

import {
  mapCapabilityToGitHubPermissions,
  permissionSummary,
  toGitHubRepositoryJsonId,
} from "../../domain/index.js";
import type { GitHubTokenBrokerFeatureGatePolicy } from "../ports/policies.js";
import type { GitHubTokenTargetAuthorizationPort } from "../ports/target-authorization.port.js";

export type DryRunGitHubTokenScopeInput = Readonly<{
  workspaceId: string;
  targetId: string;
  capability: string;
  subjectKind: TargetPolicySubjectKind;
  subjectId: string;
  desktopClientSubjectId?: string;
  teamSubjectId?: string;
  agentSubjectId?: string;
}>;

export type DryRunGitHubTokenScopeResult = Readonly<{
  allowed: boolean;
  reasonCode: string;
  policyVersion?: number;
  repositoryCount: number;
  permissionSummary: Readonly<Record<string, string>>;
}>;

export class DryRunGitHubTokenScopeUseCase {
  public constructor(
    private readonly featureGate: GitHubTokenBrokerFeatureGatePolicy,
    private readonly targetAuthorization: GitHubTokenTargetAuthorizationPort,
    private readonly clock: Clock = new SystemClock(),
  ) {}

  public async execute(
    input: DryRunGitHubTokenScopeInput,
  ): Promise<DryRunGitHubTokenScopeResult> {
    await this.featureGate.assertEnabled("github-token-broker");
    const workspaceId = parseWorkspaceId(input.workspaceId);
    if (!workspaceId.ok) {
      throw workspaceId.error;
    }
    const targetId = parseIntegrationTargetId(input.targetId);
    const permissions = mapCapabilityToGitHubPermissions(input.capability);
    const subjectId = normalizeTargetPolicySubjectId({
      subjectId: input.subjectId,
      subjectKind: input.subjectKind,
    });
    const authorization = await this.targetAuthorization.authorize({
      capability: input.capability,
      nowMs: this.clock.nowMs(),
      subjectId,
      subjectKind: input.subjectKind,
      targetId,
      workspaceId: workspaceId.value,
      ...(input.agentSubjectId === undefined
        ? {}
        : { agentSubjectId: input.agentSubjectId }),
      ...(input.desktopClientSubjectId === undefined
        ? {}
        : { desktopClientSubjectId: input.desktopClientSubjectId }),
      ...(input.teamSubjectId === undefined
        ? {}
        : { teamSubjectId: input.teamSubjectId }),
    });
    if (!authorization.allowed || authorization.scope === undefined) {
      return {
        allowed: false,
        permissionSummary: permissionSummary(permissions),
        reasonCode: authorization.reasonCode,
        repositoryCount: 0,
        ...(authorization.policyVersion === undefined
          ? {}
          : { policyVersion: authorization.policyVersion }),
      };
    }
    try {
      toGitHubRepositoryJsonId(authorization.scope.githubRepositoryId);
    } catch {
      return {
        allowed: false,
        permissionSummary: permissionSummary(permissions),
        reasonCode: "CONTROL_PLANE_GITHUB_REPOSITORY_ID_UNSUPPORTED",
        repositoryCount: 0,
        ...(authorization.policyVersion === undefined
          ? {}
          : { policyVersion: authorization.policyVersion }),
      };
    }
    return {
      allowed: true,
      permissionSummary: permissionSummary(permissions),
      reasonCode: "CONTROL_PLANE_GITHUB_TOKEN_SCOPE_ALLOWED",
      repositoryCount: 1,
      ...(authorization.policyVersion === undefined
        ? {}
        : { policyVersion: authorization.policyVersion }),
    };
  }
}
