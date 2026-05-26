import { Module } from "@nestjs/common";

import { SystemHealthModule } from "@agent-teams-control-plane/features-system-health/interface/nest";
import { PlatformApiModule } from "@agent-teams-control-plane/platform-api";
import { PlatformConfigModule } from "@agent-teams-control-plane/platform-config";
import { PlatformLoggerModule } from "@agent-teams-control-plane/platform-logger";

@Module({
  imports: [
    PlatformConfigModule,
    PlatformLoggerModule,
    PlatformApiModule,
    SystemHealthModule,
  ],
})
export class ControlPlaneApiModule {}
