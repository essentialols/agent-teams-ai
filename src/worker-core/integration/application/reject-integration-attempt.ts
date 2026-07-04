import {
  markRejected,
  type IntegrationAttempt,
} from "../domain/integration-attempt";
import { IntegrationAuditEventType } from "../domain/integration-events";
import {
  loadIntegrationAttempt,
  nowIso,
  recordIntegrationAudit,
  type IntegrationUseCaseDeps,
} from "./common";

export type RejectIntegrationAttemptInput = {
  readonly attemptId: string;
  readonly reason: string;
};

export async function rejectIntegrationAttempt(
  deps: IntegrationUseCaseDeps,
  input: RejectIntegrationAttemptInput,
): Promise<IntegrationAttempt> {
  const attempt = await loadIntegrationAttempt(deps.store, input.attemptId);
  const now = nowIso(deps.clock);
  const updated = markRejected(attempt, {
    reason: input.reason,
    now,
  });
  await deps.store.update(updated);
  await recordIntegrationAudit(deps, updated, {
    type: IntegrationAuditEventType.Rejected,
    occurredAt: now,
    safeReason: input.reason,
  });
  return updated;
}
