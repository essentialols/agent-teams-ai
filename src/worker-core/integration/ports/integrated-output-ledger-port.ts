import type { IntegrationAttempt } from "../domain/integration-attempt";

export type IntegratedOutputLedgerPreparation = {
  readonly attemptId: string;
  readonly workerJobId: string;
  readonly workerWorkspacePath: string;
  readonly commitSha: string;
  readonly archivePath: string;
  readonly statusPath: string;
  readonly patchPath: string;
  readonly numstatPath: string;
};

export type IntegratedOutputLedgerReceipt = {
  readonly ledgerPath: string;
  readonly archivePath: string;
  readonly commitSha: string;
  readonly idempotentReplay: boolean;
};

export interface IntegratedOutputLedgerPort {
  prepare(input: {
    readonly attempt: IntegrationAttempt;
    readonly commitSha: string;
  }): Promise<IntegratedOutputLedgerPreparation>;

  finalize(input: {
    readonly preparation: IntegratedOutputLedgerPreparation;
    readonly pushedAt: string;
  }): Promise<IntegratedOutputLedgerReceipt>;
}
