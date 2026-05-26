import { Module } from "@nestjs/common";

import { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";

import type { HealthEnvironmentReader } from "../../application/ports/health-environment-reader.js";
import { GetHealthReportUseCase } from "../../application/use-cases/get-health-report.use-case.js";
import { ConfigHealthEnvironmentReader } from "../../infrastructure/config-health-environment.reader.js";
import { HealthController } from "./health.controller.js";
import { HEALTH_ENVIRONMENT_READER } from "./tokens.js";

@Module({
  controllers: [HealthController],
  exports: [GetHealthReportUseCase],
  providers: [
    {
      inject: [ControlPlaneConfigService],
      provide: HEALTH_ENVIRONMENT_READER,
      useFactory: (configService: ControlPlaneConfigService) =>
        new ConfigHealthEnvironmentReader(configService),
    },
    {
      inject: [HEALTH_ENVIRONMENT_READER],
      provide: GetHealthReportUseCase,
      useFactory: (environmentReader: HealthEnvironmentReader) =>
        new GetHealthReportUseCase(environmentReader),
    },
  ],
})
export class SystemHealthModule {}
