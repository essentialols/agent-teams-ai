import { resolve } from "node:path";
import {
  assertTerminalOutputDecision,
  type TerminalOutputDecision,
} from "../domain/terminal-output-decision";
import type {
  ConsumedOutputLedgerWriterPort,
  TerminalOutputDecisionReceipt,
} from "../ports/consumed-output-ledger-writer-port";

export async function recordTerminalOutputDecision(
  deps: { readonly writer: ConsumedOutputLedgerWriterPort },
  input: {
    readonly allowedLedgerRoots: readonly string[];
    readonly ledgerRoot: string;
    readonly decision: TerminalOutputDecision;
  },
): Promise<TerminalOutputDecisionReceipt> {
  const allowed = new Set(input.allowedLedgerRoots.map((root) => resolve(root)));
  if (allowed.size === 0) throw new Error("consumed_output_ledger_required");
  if (!allowed.has(resolve(input.ledgerRoot))) {
    throw new Error("consumed_output_ledger_root_outside_scope");
  }
  return await deps.writer.record({
    ledgerRoot: input.ledgerRoot,
    decision: assertTerminalOutputDecision(input.decision),
  });
}
