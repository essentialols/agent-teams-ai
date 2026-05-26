import type { ExternalActionContentRef } from "../../domain/external-action-content.js";
import type { ExternalActionContentRepository } from "../ports/external-action-content.repository.js";
import type { TransactionContext } from "../ports/transaction-context.js";

export type ShredExternalActionContentInput = Readonly<{
  ref: ExternalActionContentRef;
  context: TransactionContext;
}>;

export class ShredExternalActionContentUseCase {
  public constructor(private readonly repository: ExternalActionContentRepository) {}

  public async execute(input: ShredExternalActionContentInput): Promise<void> {
    await this.repository.shred(input.ref, input.context);
  }
}
