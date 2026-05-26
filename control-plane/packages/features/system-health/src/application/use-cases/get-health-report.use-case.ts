import { createControlPlaneServiceInfo } from "@agent-teams-control-plane/shared";

import type { HealthReport } from "../../domain/health-report.js";
import type { HealthEnvironmentReader } from "../ports/health-environment-reader.js";

export class GetHealthReportUseCase {
  public constructor(private readonly environmentReader: HealthEnvironmentReader) {}

  public execute(): HealthReport {
    const environment = this.environmentReader.read();

    return {
      configuration: {
        githubRestApiVersionConfigured: environment.githubRestApiVersionConfigured,
        publicBaseUrlConfigured: environment.publicBaseUrlConfigured,
      },
      mode: environment.mode,
      service: createControlPlaneServiceInfo(environment.build),
      status: "ok",
      uptimeSeconds: environment.uptimeSeconds,
    };
  }
}
