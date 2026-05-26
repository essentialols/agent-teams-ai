import type { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";
import type { DatabaseReadinessProbe } from "@agent-teams-control-plane/platform-database";

import type {
  HealthEnvironment,
  HealthEnvironmentReader,
} from "../application/ports/health-environment-reader.js";

export class ConfigHealthEnvironmentReader implements HealthEnvironmentReader {
  public constructor(
    private readonly configService: ControlPlaneConfigService,
    private readonly databaseReadiness: DatabaseReadinessProbe,
  ) {}

  public async read(): Promise<HealthEnvironment> {
    const config = this.configService.getConfig();
    const summary = this.configService.getSafeSummary();
    const database = await this.databaseReadiness.check({ timeoutMs: 1000 });

    return {
      build: config.build,
      database,
      githubRestApiVersionConfigured: summary.github.restApiVersionConfigured,
      mode: summary.mode,
      publicBaseUrlConfigured: summary.publicBaseUrlConfigured,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
