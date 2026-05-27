import type { DesktopClientActor } from "@agent-teams-control-plane/features-workspace-identity";
import {
  createSafeError,
  parseAgentActionId,
  parseExternalActionContentId,
  parseWorkspaceId,
  SystemClock,
  type Clock,
} from "@agent-teams-control-plane/shared";
import {
  assertTargetPolicySubjectKind,
  normalizeTargetPolicySubjectId,
  parseIntegrationTargetId,
} from "@agent-teams-control-plane/features-integration-targets";

import {
  assertGitHubActionType,
  bodyFromActionPayload,
  capabilityForGitHubActionType,
  decodeGitHubActionPayload,
  renderGitHubActionBody,
  validateAttributionRendererSettings,
  validateGitHubActionAttribution,
  validateGitHubActionPayload,
  type GitHubActionAttribution,
  type GitHubActionPayload,
  type GitHubActionRequest,
} from "../../domain/index.js";
import type { GitHubActionContentStore } from "../ports/github-action-content-store.port.js";
import type { GitHubActionIdGenerator } from "../ports/entropy.js";
import type { GitHubActionOutbox } from "../ports/github-action-outbox.port.js";
import type { GitHubActionRepository } from "../ports/github-action.repository.js";
import type {
  AgentGitHubActionsAuditLog,
  AgentGitHubActionsFeatureGatePolicy,
  AgentGitHubActionsSettings,
} from "../ports/policies.js";
import type { TargetPolicyEvaluatorPort } from "../ports/target-policy-evaluator.port.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";
import { encodeGitHubActionPayloadEnvelope } from "./action-content-codec.js";

export type RequestGitHubActionInput = Readonly<{
  actor: DesktopClientActor;
  requestId: string;
  targetId: string;
  actionType: string;
  requestedBy: Readonly<{
    subjectKind: string;
    subjectId: string;
    teamId?: string;
    agentId?: string;
  }>;
  attribution: GitHubActionAttribution;
  payload: unknown;
  correlationId?: string;
}>;

export type RequestGitHubActionResult = Readonly<{
  actionRequestId: string;
  status: GitHubActionRequest["status"];
  idempotent: boolean;
}>;

export class RequestGitHubActionUseCase {
  public constructor(
    private readonly featureGate: AgentGitHubActionsFeatureGatePolicy,
    private readonly settings: AgentGitHubActionsSettings,
    private readonly targetPolicyEvaluator: TargetPolicyEvaluatorPort,
    private readonly contentStore: GitHubActionContentStore,
    private readonly repository: GitHubActionRepository,
    private readonly outbox: GitHubActionOutbox,
    private readonly transactions: TransactionRunner,
    private readonly ids: GitHubActionIdGenerator,
    private readonly auditLog: AgentGitHubActionsAuditLog,
    private readonly clock: Clock = new SystemClock(),
  ) {}

  public async execute(
    input: RequestGitHubActionInput,
  ): Promise<RequestGitHubActionResult> {
    await this.featureGate.assertEnabled("agent-github-actions");
    const workspaceId = parseWorkspaceId(input.actor.workspaceId);
    if (!workspaceId.ok) {
      throw workspaceId.error;
    }
    const requestId = normalizeRequestId(input.requestId);
    const existing = await this.repository.findByIdempotency({
      idempotencyKey: requestId,
      workspaceId: workspaceId.value,
    });
    if (existing !== undefined) {
      await this.auditLog.record({
        actionRequestId: existing.id,
        actorId: input.actor.desktopClientId,
        actorKind: "desktop_client",
        eventType: "github_action.request_idempotent_hit",
        integrationTargetId: existing.integrationTargetId,
        status: "accepted",
        workspaceId: existing.workspaceId,
        ...(input.correlationId === undefined
          ? {}
          : { correlationId: input.correlationId }),
      });
      return {
        actionRequestId: existing.id,
        idempotent: true,
        status: existing.status,
      };
    }

    const actionType = assertGitHubActionType(input.actionType);
    const payload = decodeAndValidatePayload(actionType, input.payload);
    const attribution = normalizeAttribution(input.attribution, input.requestedBy);
    const invalidAttribution = validateGitHubActionAttribution(attribution);
    if (invalidAttribution !== undefined) {
      throw invalidAttribution;
    }
    const rendererSettings = getRendererSettings(this.settings);
    const invalidRenderer = validateAttributionRendererSettings(rendererSettings);
    if (invalidRenderer !== undefined) {
      throw invalidRenderer;
    }

    const targetId = parseIntegrationTargetId(input.targetId);
    const subjectKind = assertTargetPolicySubjectKind(input.requestedBy.subjectKind);
    const subjectId = normalizeTargetPolicySubjectId({
      subjectId: input.requestedBy.subjectId,
      subjectKind,
    });
    const capability = capabilityForGitHubActionType(actionType);
    const policy = await this.targetPolicyEvaluator.evaluate({
      capability,
      desktopClientSubjectId: `desktop-client:${input.actor.desktopClientId}`,
      subjectId,
      subjectKind,
      targetId,
      workspaceId: workspaceId.value,
      ...(attribution.agentId === undefined
        ? {}
        : { agentSubjectId: attribution.agentId }),
      ...(attribution.teamId === undefined ? {} : { teamSubjectId: attribution.teamId }),
    });
    if (!policy.allowed) {
      const safeError = createSafeError({
        category: "authorization",
        code: policy.reasonCode,
        message: "GitHub action request is not authorized for this target.",
        safeDetails: { policyVersion: policy.policyVersion },
      });
      await this.auditLog.record({
        actorId: input.actor.desktopClientId,
        actorKind: "desktop_client",
        eventType: "github_action.request_denied",
        integrationTargetId: targetId,
        safeErrorCode: safeError.code,
        status: "denied",
        subjectId,
        subjectKind,
        workspaceId: workspaceId.value,
        ...(input.correlationId === undefined
          ? {}
          : { correlationId: input.correlationId }),
      });
      throw safeError;
    }

    const actionId = parseAgentActionId(this.ids.uuid());
    if (!actionId.ok) {
      throw actionId.error;
    }
    const contentId = parseExternalActionContentId(this.ids.uuid());
    if (!contentId.ok) {
      throw contentId.error;
    }
    validateRenderedPreview({
      actionId: actionId.value,
      attribution,
      payload,
      rendererSettings,
    });
    const retentionDays = this.settings.externalContentRetentionDays();
    if (retentionDays === undefined) {
      throw createSafeError({
        category: "validation",
        code: "CONTROL_PLANE_GITHUB_ACTION_CONTENT_RETENTION_REQUIRED",
        message: "GitHub actions require external content retention.",
      });
    }
    const expiresAt = new Date(this.clock.nowMs() + retentionDays * 24 * 60 * 60 * 1000);

    const result = await this.transactions.runInTransaction(async (context) => {
      const contentRef = await this.contentStore.store({
        context,
        expiresAt,
        id: contentId.value,
        plaintext: encodeGitHubActionPayloadEnvelope({ actionType, payload }),
      });
      const created = await this.repository.createQueued(
        {
          actionType,
          assertedByDesktopClientId: input.actor.desktopClientId,
          attribution,
          externalContentIntegrityHash: contentRef.ciphertextSha256,
          externalContentRefId: contentRef.id,
          id: actionId.value,
          idempotencyKey: requestId,
          integrationTargetId: targetId,
          requestedBySubjectId: subjectId,
          requestedBySubjectKind: subjectKind,
          workspaceId: workspaceId.value,
        },
        context,
      );

      if (!created.created) {
        await this.contentStore.shred({ context, ref: contentRef });
        return { created: false, request: created.request };
      }

      await this.outbox.enqueueDispatch({
        actionRequestId: created.request.id,
        contentIntegrityHash: contentRef.ciphertextSha256,
        contentRefId: contentRef.id,
        context,
        maxAttempts: 10,
        nextAttemptAtMs: this.clock.nowMs(),
        workspaceId: workspaceId.value,
      });
      return { created: true, request: created.request };
    });

    await this.auditLog.record({
      actionRequestId: result.request.id,
      actorId: input.actor.desktopClientId,
      actorKind: "desktop_client",
      eventType: result.created
        ? "github_action.request_queued"
        : "github_action.request_idempotent_hit",
      integrationTargetId: targetId,
      status: result.created ? "queued" : "accepted",
      subjectId,
      subjectKind,
      workspaceId: workspaceId.value,
      ...(input.correlationId === undefined
        ? {}
        : { correlationId: input.correlationId }),
    });

    return {
      actionRequestId: result.request.id,
      idempotent: !result.created,
      status: result.request.status,
    };
  }
}

function decodeAndValidatePayload(
  actionType: ReturnType<typeof assertGitHubActionType>,
  payloadInput: unknown,
): GitHubActionPayload {
  const payload = decodeGitHubActionPayload({ actionType, payload: payloadInput });
  const invalid = validateGitHubActionPayload({ actionType, payload });
  if (invalid !== undefined) {
    throw invalid;
  }
  return payload;
}

function normalizeAttribution(
  attribution: GitHubActionAttribution,
  requestedBy: RequestGitHubActionInput["requestedBy"],
): GitHubActionAttribution {
  return {
    agentDisplayName: attribution.agentDisplayName,
    ...(attribution.agentAvatarUrl === undefined
      ? {}
      : { agentAvatarUrl: attribution.agentAvatarUrl }),
    ...(requestedBy.agentId === undefined ? {} : { agentId: requestedBy.agentId }),
    ...(attribution.teamDisplayName === undefined
      ? {}
      : { teamDisplayName: attribution.teamDisplayName }),
    ...(requestedBy.teamId === undefined ? {} : { teamId: requestedBy.teamId }),
  };
}

function normalizeRequestId(value: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (
    normalized.length === 0 ||
    normalized.length > 160 ||
    /\s/.test(normalized) ||
    !/^[A-Za-z0-9._:-]+$/.test(normalized)
  ) {
    throw createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_GITHUB_ACTION_REQUEST_ID_INVALID",
      message: "GitHub action request id is invalid.",
    });
  }
  return normalized;
}

function getRendererSettings(settings: AgentGitHubActionsSettings) {
  const defaultAgentAvatarUrl = settings.defaultAgentAvatarUrl();
  if (defaultAgentAvatarUrl === undefined) {
    throw createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_GITHUB_ACTION_DEFAULT_AVATAR_REQUIRED",
      message: "Default Agent Teams avatar URL is required.",
    });
  }
  return {
    allowedAvatarOrigins: settings.agentAvatarAllowedOrigins(),
    defaultAgentAvatarUrl,
  };
}

function validateRenderedPreview(input: {
  actionId: string;
  attribution: GitHubActionAttribution;
  payload: GitHubActionPayload;
  rendererSettings: ReturnType<typeof getRendererSettings>;
}): void {
  const body = bodyFromActionPayload(input.payload);
  if (body === undefined) {
    return;
  }
  renderGitHubActionBody({
    actionRequestId: input.actionId,
    attribution: input.attribution,
    body,
    settings: input.rendererSettings,
  });
}
