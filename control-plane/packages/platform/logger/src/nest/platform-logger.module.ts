import { Global, Module } from "@nestjs/common";

import { CONTROL_PLANE_LOGGER, ConsoleControlPlaneLogger } from "../logger.js";

@Global()
@Module({
  exports: [CONTROL_PLANE_LOGGER],
  providers: [
    {
      provide: CONTROL_PLANE_LOGGER,
      useFactory: () => new ConsoleControlPlaneLogger("control-plane"),
    },
  ],
})
export class PlatformLoggerModule {}
