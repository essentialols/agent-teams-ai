import { Module } from "@nestjs/common";

import { AgentGitHubActionsModule } from "@agent-teams-control-plane/features-agent-github-actions/interface/nest";
import { OutboxModule } from "@agent-teams-control-plane/features-outbox/interface/nest";
import { PlatformConfigModule } from "@agent-teams-control-plane/platform-config";
import { PlatformDatabaseModule } from "@agent-teams-control-plane/platform-database/nest";
import { PlatformLoggerModule } from "@agent-teams-control-plane/platform-logger";

import { WorkerRunner } from "./worker-runner.js";

@Module({
  imports: [
    PlatformConfigModule,
    PlatformLoggerModule,
    PlatformDatabaseModule,
    OutboxModule,
    AgentGitHubActionsModule,
  ],
  providers: [WorkerRunner],
})
export class WorkerModule {}
