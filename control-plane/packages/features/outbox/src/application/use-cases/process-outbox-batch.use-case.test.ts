import { describe, expect, it } from "vitest";

import { createSafeError, toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { OutboxHandlerRegistry } from "../ports/outbox-handler.js";
import type { ClaimedOutboxEvent, OutboxRepository } from "../ports/outbox.repository.js";
import { ProcessOutboxBatchUseCase } from "./process-outbox-batch.use-case.js";

describe("ProcessOutboxBatchUseCase", () => {
  it("dead-letters unknown event versions", async () => {
    const calls: string[] = [];
    const repository = createRepository(calls);
    const handlers: OutboxHandlerRegistry = {
      getHandler: () => undefined,
    };
    const useCase = new ProcessOutboxBatchUseCase(repository, handlers);

    const result = await useCase.execute({ batch: [claimedEvent()] });

    expect(result.deadLettered).toBe(1);
    expect(calls).toEqual(["dead-letter"]);
  });

  it("counts stale claim completion separately", async () => {
    const repository = createRepository([]);
    repository.markCompleted = async () => "stale-claim";
    const handlers: OutboxHandlerRegistry = {
      getHandler: () => ({
        handle: async () => ({ kind: "completed" }),
      }),
    };
    const useCase = new ProcessOutboxBatchUseCase(repository, handlers);

    const result = await useCase.execute({ batch: [claimedEvent()] });

    expect(result).toMatchObject({ completed: 0, staleClaims: 1 });
  });
});

function createRepository(calls: string[]): OutboxRepository {
  return {
    append: async () => {
      throw new Error("unused");
    },
    claimNextBatch: async () => [],
    markCompleted: async () => {
      calls.push("complete");
      return "updated";
    },
    markDeadLettered: async () => {
      calls.push("dead-letter");
      return "updated";
    },
    markFailedForRetry: async () => {
      calls.push("retry");
      return "updated";
    },
    recoverStaleProcessing: async () => 0,
  };
}

function claimedEvent(): ClaimedOutboxEvent {
  return {
    attempts: 1,
    claimToken: "claim-token",
    createdAtMs: toUnixMilliseconds(0),
    id: "event-1" as never,
    idempotencyKey: "workspace:event",
    lastSafeError: createSafeError({
      category: "internal",
      code: "TEST",
      message: "test",
    }),
    lockedBy: "worker-1",
    lockedUntilMs: toUnixMilliseconds(1000),
    maxAttempts: 3,
    nextAttemptAtMs: toUnixMilliseconds(0),
    payload: {},
    status: "processing",
    type: "test.event",
    updatedAtMs: toUnixMilliseconds(0),
    version: 1,
  };
}
