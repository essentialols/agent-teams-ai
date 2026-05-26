import type { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";

import type {
  HealthEnvironment,
  HealthEnvironmentReader,
} from "../application/ports/health-environment-reader.js";

export class ConfigHealthEnvironmentReader implements HealthEnvironmentReader {
  public constructor(private readonly configService: ControlPlaneConfigService) {}

  public read(): HealthEnvironment {
    const summary = this.configService.getSafeSummary();

    return {
      githubRestApiVersionConfigured: summary.github.restApiVersionConfigured,
      mode: summary.mode,
      publicBaseUrlConfigured: summary.publicBaseUrlConfigured,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
