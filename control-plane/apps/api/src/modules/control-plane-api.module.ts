import { Module } from "@nestjs/common";

import { ExternalActionContentModule } from "@agent-teams-control-plane/features-external-action-content/interface/nest";
import { OutboxModule } from "@agent-teams-control-plane/features-outbox/interface/nest";
import { SystemHealthModule } from "@agent-teams-control-plane/features-system-health/interface/nest";
import { PlatformApiModule } from "@agent-teams-control-plane/platform-api";
import { PlatformConfigModule } from "@agent-teams-control-plane/platform-config";
import { PlatformCryptoModule } from "@agent-teams-control-plane/platform-crypto/nest";
import { PlatformDatabaseModule } from "@agent-teams-control-plane/platform-database/nest";
import { PlatformLoggerModule } from "@agent-teams-control-plane/platform-logger";

@Module({
  imports: [
    PlatformConfigModule,
    PlatformLoggerModule,
    PlatformDatabaseModule,
    PlatformCryptoModule,
    PlatformApiModule,
    ExternalActionContentModule,
    OutboxModule,
    SystemHealthModule,
  ],
})
export class ControlPlaneApiModule {}
