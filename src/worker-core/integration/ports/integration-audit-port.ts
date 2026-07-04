import type { IntegrationAuditEvent } from "../domain/integration-events";

export interface IntegrationAuditPort {
  record(event: IntegrationAuditEvent): Promise<void> | void;
}
