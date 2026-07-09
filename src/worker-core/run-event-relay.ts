import type {
  RunEventDeliveryCursorStorePort,
  RunEventPublisherPort,
  RunEventRelayResult,
  RunEventStorePort,
  RunEventType,
} from "./run-event-types";

export class RunEventRelayService {
  constructor(private readonly options: {
    readonly eventStore: RunEventStorePort;
    readonly cursorStore: RunEventDeliveryCursorStorePort;
    readonly publisher: RunEventPublisherPort;
  }) {}

  async relay(input: {
    readonly consumerId: string;
    readonly limit?: number;
    readonly runId?: string;
    readonly types?: readonly RunEventType[];
  }): Promise<RunEventRelayResult> {
    if (!input.consumerId.trim()) {
      throw new Error("run_event_relay_consumer_id_required");
    }
    const cursor = await this.options.cursorStore.readDeliveryCursor(
      input.consumerId,
    );
    const read = await this.options.eventStore.read({
      ...(cursor === null ? {} : { cursor }),
      ...(input.limit === undefined ? {} : { limit: input.limit }),
      ...(input.runId === undefined ? {} : { runId: input.runId }),
      ...(input.types === undefined ? {} : { types: input.types }),
    });
    if (read.events.length > 0) {
      await this.options.publisher.publish(read.events);
    }
    if (read.nextCursor !== undefined) {
      await this.options.cursorStore.writeDeliveryCursor({
        consumerId: input.consumerId,
        cursor: read.nextCursor,
      });
    }
    return {
      consumerId: input.consumerId,
      readCount: read.events.length,
      publishedCount: read.events.length,
      ...(read.nextCursor === undefined ? {} : { nextCursor: read.nextCursor }),
      warnings: read.warnings,
    };
  }
}
