import type {
  ExternalActionContentId,
  OutboxEventId,
  SafeError,
  UnixMilliseconds,
} from "@agent-teams-control-plane/shared";

import type { JsonObject } from "./outbox-event.js";

export type DeadLetterEvent = Readonly<{
  id: string;
  outboxEventId: OutboxEventId;
  eventType: string;
  eventVersion: number;
  finalSafeError: SafeError;
  attempts: number;
  payloadSummary: JsonObject;
  contentRefId?: ExternalActionContentId;
  createdAtMs: UnixMilliseconds;
}>;
