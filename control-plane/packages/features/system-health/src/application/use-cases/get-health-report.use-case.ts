import { createControlPlaneServiceInfo } from "@agent-teams-control-plane/shared";

import type { HealthReport } from "../../domain/health-report.js";
import type { HealthEnvironmentReader } from "../ports/health-environment-reader.js";

export class GetHealthReportUseCase {
  public constructor(private readonly environmentReader: HealthEnvironmentReader) {}

  public async execute(): Promise<HealthReport> {
    const environment = await this.environmentReader.read();

    return {
      configuration: {
        githubRestApiVersionConfigured: environment.githubRestApiVersionConfigured,
        publicBaseUrlConfigured: environment.publicBaseUrlConfigured,
      },
      mode: environment.mode,
      readiness: {
        database: environment.database,
        status: environment.database.status === "unavailable" ? "degraded" : "ready",
      },
      service: createControlPlaneServiceInfo(environment.build),
      status: "ok",
      uptimeSeconds: environment.uptimeSeconds,
    };
  }
}
