import {
  CONTROL_PLANE_SERVICE_NAME,
  CONTROL_PLANE_SERVICE_VERSION,
} from "@agent-teams-control-plane/shared";

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
      service: {
        name: CONTROL_PLANE_SERVICE_NAME,
        version: CONTROL_PLANE_SERVICE_VERSION,
      },
      status: "ok",
      uptimeSeconds: environment.uptimeSeconds,
    };
  }
}
