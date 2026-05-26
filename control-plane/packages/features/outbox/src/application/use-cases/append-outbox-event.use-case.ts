import {
  validateNewOutboxEvent,
  type NewOutboxEvent,
  type OutboxEvent,
} from "../../domain/outbox-event.js";
import type { OutboxRepository } from "../ports/outbox.repository.js";
import type { TransactionContext } from "../ports/transaction-context.js";

export class AppendOutboxEventUseCase {
  public constructor(private readonly repository: OutboxRepository) {}

  public async execute(
    event: NewOutboxEvent,
    context: TransactionContext,
  ): Promise<OutboxEvent> {
    const invalid = validateNewOutboxEvent(event);
    if (invalid !== undefined) {
      throw invalid;
    }

    return this.repository.append(event, context);
  }
}
