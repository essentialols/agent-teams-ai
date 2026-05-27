import type {
  AppendOutboxEventUseCase,
  JsonObject,
} from "@agent-teams-control-plane/features-outbox";
import {
  parseOutboxEventId,
  toUnixMilliseconds,
  type AgentActionId,
} from "@agent-teams-control-plane/shared";

import {
  GITHUB_ACTION_DISPATCH_EVENT_TYPE,
  GITHUB_ACTION_DISPATCH_EVENT_VERSION,
  type GitHubActionOutbox,
} from "../../application/ports/github-action-outbox.port.js";
import type { GitHubActionIdGenerator } from "../../application/ports/entropy.js";

export class GitHubActionOutboxAdapter implements GitHubActionOutbox {
  public constructor(
    private readonly appendOutboxEvent: AppendOutboxEventUseCase,
    private readonly ids: GitHubActionIdGenerator,
  ) {}

  public async enqueueDispatch(
    input: Parameters<GitHubActionOutbox["enqueueDispatch"]>[0],
  ): Promise<void> {
    const eventId = parseOutboxEventId(this.ids.uuid());
    if (!eventId.ok) {
      throw eventId.error;
    }
    const payload = safeDispatchPayload(input.actionRequestId);
    await this.appendOutboxEvent.execute(
      {
        aggregateId: input.actionRequestId,
        aggregateKind: "github_action_request",
        contentIntegrityHash: input.contentIntegrityHash,
        contentRefId: input.contentRefId,
        id: eventId.value,
        idempotencyKey: `github-action-dispatch:${input.workspaceId}:${input.actionRequestId}`,
        maxAttempts: input.maxAttempts,
        nextAttemptAtMs: toUnixMilliseconds(input.nextAttemptAtMs),
        payload,
        type: GITHUB_ACTION_DISPATCH_EVENT_TYPE,
        version: GITHUB_ACTION_DISPATCH_EVENT_VERSION,
        workspaceId: input.workspaceId,
      },
      input.context,
    );
  }
}

function safeDispatchPayload(actionRequestId: AgentActionId): JsonObject {
  return {
    actionRequestId,
  };
}
