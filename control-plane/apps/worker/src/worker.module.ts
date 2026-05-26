import { Module } from "@nestjs/common";

import { PlatformConfigModule } from "@agent-teams-control-plane/platform-config";
import { PlatformLoggerModule } from "@agent-teams-control-plane/platform-logger";

import { WorkerRunner } from "./worker-runner.js";

@Module({
  imports: [PlatformConfigModule, PlatformLoggerModule],
  providers: [WorkerRunner],
})
export class WorkerModule {}
