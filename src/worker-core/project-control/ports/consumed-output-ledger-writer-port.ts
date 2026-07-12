import type { TerminalOutputDecision } from "../domain/terminal-output-decision";

export type TerminalOutputDecisionReceipt = {
  readonly ledgerPath: string;
  readonly decision: TerminalOutputDecision;
  readonly idempotentReplay: boolean;
};

export interface ConsumedOutputLedgerWriterPort {
  record(input: {
    readonly ledgerRoot: string;
    readonly decision: TerminalOutputDecision;
  }): Promise<TerminalOutputDecisionReceipt>;
}
