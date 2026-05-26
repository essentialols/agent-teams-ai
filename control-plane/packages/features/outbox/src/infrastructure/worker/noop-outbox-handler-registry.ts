import type {
  OutboxEventHandler,
  OutboxHandlerRegistry,
} from "../../application/ports/outbox-handler.js";

export const CONTROL_PLANE_FAKE_NOOP_EVENT_TYPE = "control-plane.fake.noop";
export const CONTROL_PLANE_FAKE_NOOP_EVENT_VERSION = 1;

export class NoopOutboxHandlerRegistry implements OutboxHandlerRegistry {
  private readonly noopHandler: OutboxEventHandler = {
    handle: async () => ({ kind: "completed" }),
  };

  public getHandler(input: {
    eventType: string;
    eventVersion: number;
  }): OutboxEventHandler | undefined {
    if (
      input.eventType === CONTROL_PLANE_FAKE_NOOP_EVENT_TYPE &&
      input.eventVersion === CONTROL_PLANE_FAKE_NOOP_EVENT_VERSION
    ) {
      return this.noopHandler;
    }
    return undefined;
  }
}
