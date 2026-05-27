import type {
  OutboxEventHandler,
  OutboxHandlerRegistry,
} from "../../application/ports/outbox-handler.js";
import {
  CONTROL_PLANE_FAKE_NOOP_EVENT_TYPE,
  CONTROL_PLANE_FAKE_NOOP_EVENT_VERSION,
} from "./noop-outbox-handler-registry.js";

export class CompositeOutboxHandlerRegistry implements OutboxHandlerRegistry {
  private readonly handlers = new Map<string, OutboxEventHandler>();
  private readonly noopHandler: OutboxEventHandler = {
    handle: async () => ({ kind: "completed" }),
  };

  public constructor() {
    this.register({
      eventType: CONTROL_PLANE_FAKE_NOOP_EVENT_TYPE,
      eventVersion: CONTROL_PLANE_FAKE_NOOP_EVENT_VERSION,
      handler: this.noopHandler,
    });
  }

  public register(input: {
    eventType: string;
    eventVersion: number;
    handler: OutboxEventHandler;
  }): void {
    this.handlers.set(registryKey(input), input.handler);
  }

  public getHandler(input: {
    eventType: string;
    eventVersion: number;
  }): OutboxEventHandler | undefined {
    return this.handlers.get(registryKey(input));
  }
}

function registryKey(input: { eventType: string; eventVersion: number }): string {
  return `${input.eventType}:v${input.eventVersion}`;
}
