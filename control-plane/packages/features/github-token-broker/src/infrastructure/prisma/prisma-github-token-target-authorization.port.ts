import { Inject, Injectable } from "@nestjs/common";

import {
  evaluateTargetPolicy,
  parseIntegrationTargetId,
  parseTargetPolicyRuleId,
  type IntegrationTarget,
  type TargetPolicyRule,
} from "@agent-teams-control-plane/features-integration-targets";
import { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";
import {
  PRISMA_DATABASE_CLIENT,
  type PrismaDatabaseClient,
} from "@agent-teams-control-plane/platform-database";
import {
  parseDesktopClientId,
  parseIntegrationConnectionId,
  parseWorkspaceId,
  toUnixMilliseconds,
} from "@agent-teams-control-plane/shared";

import type {
  GitHubTokenTargetAuthorizationInput,
  GitHubTokenTargetAuthorizationPort,
  GitHubTokenTargetAuthorizationResult,
} from "../../application/ports/target-authorization.port.js";

type TargetAuthorizationRow = {
  id: string;
  workspaceId: string;
  integrationConnectionId: string;
  provider: string;
  providerTargetId: string;
  targetKind: string;
  displayName: string;
  status: string;
  policyVersion: number;
  createdAt: Date;
  updatedAt: Date;
  staleAt: Date | null;
  disabledAt: Date | null;
  deletedAt: Date | null;
  integrationConnection: {
    status: string;
    repositorySyncCursors: Array<{
      cursorKind: string;
      cursorValue: string | null;
      status: string;
    }>;
  };
  githubRepositoryBinding: {
    githubInstallationId: string;
    githubRepositoryId: string;
    lastVerifiedAt: Date;
  } | null;
  targetPolicyRules: Array<{
    id: string;
    workspaceId: string;
    integrationTargetId: string;
    subjectKind: string;
    subjectId: string;
    capability: string;
    effect: string;
    createdAt: Date;
    createdByDesktopClientId: string;
  }>;
};

@Injectable()
export class PrismaGitHubTokenTargetAuthorizationPort implements GitHubTokenTargetAuthorizationPort {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
    @Inject(ControlPlaneConfigService)
    private readonly configService: ControlPlaneConfigService,
  ) {}

  public async authorize(
    input: GitHubTokenTargetAuthorizationInput,
  ): Promise<GitHubTokenTargetAuthorizationResult> {
    const row = (await this.databaseClient.getClient().integrationTarget.findFirst({
      include: {
        githubRepositoryBinding: true,
        integrationConnection: {
          select: {
            repositorySyncCursors: true,
            status: true,
          },
        },
        targetPolicyRules: {
          orderBy: [{ subjectKind: "asc" }, { subjectId: "asc" }],
        },
      },
      where: {
        id: input.targetId,
        status: { not: "deleted" },
        workspaceId: input.workspaceId,
      },
    })) as TargetAuthorizationRow | null;

    if (row === null || row.githubRepositoryBinding === null) {
      return {
        allowed: false,
        reasonCode: "CONTROL_PLANE_TARGET_NOT_FOUND",
      };
    }
    if (row.integrationConnection.status !== "active") {
      return {
        allowed: false,
        policyVersion: row.policyVersion,
        reasonCode: "CONTROL_PLANE_TARGET_POLICY_CONNECTION_SUSPENDED",
      };
    }
    if (
      !mapRepositorySyncStatus(row.integrationConnection.repositorySyncCursors).complete
    ) {
      return {
        allowed: false,
        policyVersion: row.policyVersion,
        reasonCode: "CONTROL_PLANE_TARGET_POLICY_TARGET_STALE",
      };
    }
    if (
      input.nowMs - row.githubRepositoryBinding.lastVerifiedAt.getTime() >
      this.repositoryAvailabilityMaxAgeMs()
    ) {
      return {
        allowed: false,
        policyVersion: row.policyVersion,
        reasonCode: "CONTROL_PLANE_TARGET_POLICY_TARGET_STALE",
      };
    }

    const target = mapTarget(row);
    const result = evaluateTargetPolicy({
      capability: input.capability,
      rules: row.targetPolicyRules.map(mapPolicyRule),
      subjectId: input.subjectId,
      subjectKind: input.subjectKind,
      target,
      workspaceSubjectId: `workspace:${input.workspaceId}`,
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
    if (!result.allowed) {
      return {
        allowed: false,
        policyVersion: result.policyVersion,
        reasonCode: result.reasonCode,
      };
    }

    return {
      allowed: true,
      policyVersion: result.policyVersion,
      reasonCode: result.reasonCode,
      scope: {
        githubInstallationId: row.githubRepositoryBinding.githubInstallationId,
        githubRepositoryId: row.githubRepositoryBinding.githubRepositoryId,
        integrationTargetId: parseIntegrationTargetId(row.id),
        workspaceId: input.workspaceId,
      },
    };
  }

  private repositoryAvailabilityMaxAgeMs(): number {
    return (
      this.configService.getConfig().integrationTargets
        .repositoryAvailabilityMaxAgeHours *
      60 *
      60 *
      1000
    );
  }
}

function mapTarget(row: TargetAuthorizationRow): IntegrationTarget {
  return {
    createdAtMs: toUnixMilliseconds(row.createdAt.getTime()),
    displayName: row.displayName,
    id: parseIntegrationTargetId(row.id),
    integrationConnectionId: parseConnectionId(row.integrationConnectionId),
    policyVersion: row.policyVersion,
    provider: "github",
    providerTargetId: row.providerTargetId,
    status: assertTargetStatus(row.status),
    targetKind: "github_repository",
    updatedAtMs: toUnixMilliseconds(row.updatedAt.getTime()),
    workspaceId: parseWorkspace(row.workspaceId),
    ...(row.deletedAt === null
      ? {}
      : { deletedAtMs: toUnixMilliseconds(row.deletedAt.getTime()) }),
    ...(row.disabledAt === null
      ? {}
      : { disabledAtMs: toUnixMilliseconds(row.disabledAt.getTime()) }),
    ...(row.staleAt === null
      ? {}
      : { staleAtMs: toUnixMilliseconds(row.staleAt.getTime()) }),
  };
}

function mapPolicyRule(
  row: TargetAuthorizationRow["targetPolicyRules"][number],
): TargetPolicyRule {
  return {
    capability: assertCapability(row.capability),
    createdAtMs: toUnixMilliseconds(row.createdAt.getTime()),
    createdByDesktopClientId: parseDesktopClient(row.createdByDesktopClientId),
    effect: assertEffect(row.effect),
    id: parseTargetPolicyRuleId(row.id),
    integrationTargetId: parseIntegrationTargetId(row.integrationTargetId),
    subjectId: row.subjectId,
    subjectKind: assertSubjectKind(row.subjectKind),
    workspaceId: parseWorkspace(row.workspaceId),
  };
}

function mapRepositorySyncStatus(
  cursors: readonly { cursorKind: string; cursorValue: string | null; status: string }[],
) {
  const cursor = cursors.find(
    (item) => item.cursorKind === "github_installation_repositories",
  );
  return {
    complete: cursor?.status === "completed",
  };
}

function parseWorkspace(value: string) {
  const result = parseWorkspaceId(value);
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

function parseConnectionId(value: string) {
  const result = parseIntegrationConnectionId(value);
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

function parseDesktopClient(value: string) {
  const result = parseDesktopClientId(value);
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

function assertTargetStatus(value: string): IntegrationTarget["status"] {
  if (
    value === "enabled" ||
    value === "disabled" ||
    value === "stale" ||
    value === "revoked" ||
    value === "deleted"
  ) {
    return value;
  }
  throw new Error(`Unknown integration target status ${value}`);
}

function assertCapability(value: string): TargetPolicyRule["capability"] {
  if (
    value === "github.issue_comment.request" ||
    value === "github.pr_comment.request" ||
    value === "github.pr_review.request" ||
    value === "github.check_run.request"
  ) {
    return value;
  }
  throw new Error(`Unknown target policy capability ${value}`);
}

function assertEffect(value: string): TargetPolicyRule["effect"] {
  if (value === "allow" || value === "deny") {
    return value;
  }
  throw new Error(`Unknown target policy effect ${value}`);
}

function assertSubjectKind(value: string): TargetPolicyRule["subjectKind"] {
  if (
    value === "workspace" ||
    value === "team" ||
    value === "agent" ||
    value === "desktop_client"
  ) {
    return value;
  }
  throw new Error(`Unknown target policy subject kind ${value}`);
}
