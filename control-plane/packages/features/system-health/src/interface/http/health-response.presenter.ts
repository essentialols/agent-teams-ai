import type { HealthReport } from "../../domain/health-report.js";

export type HealthHttpResponse = Readonly<{
  service: HealthReport["service"];
  status: HealthReport["status"];
  mode: HealthReport["mode"];
  uptimeSeconds: number;
  configuration: HealthReport["configuration"];
  readiness: HealthReport["readiness"];
}>;

export function presentHealthReport(report: HealthReport): HealthHttpResponse {
  return {
    configuration: report.configuration,
    mode: report.mode,
    readiness: report.readiness,
    service: report.service,
    status: report.status,
    uptimeSeconds: report.uptimeSeconds,
  };
}
