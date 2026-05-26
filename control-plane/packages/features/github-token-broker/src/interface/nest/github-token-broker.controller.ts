import { Body, Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";

import { createSafeError } from "@agent-teams-control-plane/shared";
import { AuthenticateDesktopClientUseCase } from "@agent-teams-control-plane/features-workspace-identity";
import {
  extractDesktopBearerToken,
  type DesktopAuthRequestLike,
} from "@agent-teams-control-plane/features-workspace-identity/interface/nest";

import { CheckGitHubTokenBrokerReadinessUseCase } from "../../application/use-cases/check-github-token-broker-readiness.use-case.js";
import { DryRunGitHubTokenScopeUseCase } from "../../application/use-cases/dry-run-github-token-scope.use-case.js";

@Controller("api/desktop/v1")
export class GitHubTokenBrokerController {
  public constructor(
    @Inject(AuthenticateDesktopClientUseCase)
    private readonly authenticateDesktopClient: AuthenticateDesktopClientUseCase,
    @Inject(CheckGitHubTokenBrokerReadinessUseCase)
    private readonly checkReadiness: CheckGitHubTokenBrokerReadinessUseCase,
    @Inject(DryRunGitHubTokenScopeUseCase)
    private readonly dryRunScope: DryRunGitHubTokenScopeUseCase,
  ) {}

  @Get("integrations/github/token-broker/readiness")
  public async readiness(@Req() request: DesktopAuthRequestLike) {
    await this.authenticate(request);
    return this.checkReadiness.execute();
  }

  @Post("repository-targets/:targetId/github-token-scope/dry-run")
  public async dryRun(
    @Req() request: DesktopAuthRequestLike,
    @Param("targetId") targetId: string,
    @Body() body: unknown,
  ) {
    const actor = await this.authenticate(request);
    const input = assertRecord(body);
    const subjectKind = optionalSubjectKind(input.subjectKind) ?? "desktop_client";
    return this.dryRunScope.execute({
      capability: requiredString(input.capability, "capability"),
      desktopClientSubjectId: `desktop-client:${actor.desktopClientId}`,
      subjectId:
        optionalString(input.subjectId) ?? `desktop-client:${actor.desktopClientId}`,
      subjectKind,
      targetId,
      workspaceId: actor.workspaceId,
      ...optionalSubject("agentSubjectId", input.agentSubjectId),
      ...optionalSubject("teamSubjectId", input.teamSubjectId),
    });
  }

  private async authenticate(request: DesktopAuthRequestLike) {
    return this.authenticateDesktopClient.require(extractDesktopBearerToken(request));
  }
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_INVALID_REQUEST_BODY",
    message: "Request body must be an object.",
  });
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  throw createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_INVALID_REQUEST_FIELD",
    message: "Request field is invalid.",
  });
}

function requiredString(value: unknown, field: string): string {
  const stringValue = optionalString(value);
  if (stringValue !== undefined) {
    return stringValue;
  }
  throw createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_REQUIRED_REQUEST_FIELD",
    message: "Required request field is missing.",
    safeDetails: { field },
  });
}

function optionalSubjectKind(value: unknown) {
  const kind = optionalString(value);
  if (
    kind === undefined ||
    kind === "workspace" ||
    kind === "team" ||
    kind === "agent" ||
    kind === "desktop_client"
  ) {
    return kind;
  }
  throw createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_TARGET_POLICY_SUBJECT_KIND_INVALID",
    message: "Target policy subject kind is invalid.",
  });
}

function optionalSubject(field: "agentSubjectId" | "teamSubjectId", value: unknown) {
  const subject = optionalString(value);
  return subject === undefined ? {} : { [field]: subject };
}
