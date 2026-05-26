import { Inject, Injectable } from "@nestjs/common";

import { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";
import {
  CONTROL_PLANE_LOGGER,
  type ControlPlaneLogger,
} from "@agent-teams-control-plane/platform-logger";

export type WorkerRunMode = "serve" | "smoke";

export type WorkerRunResult = Readonly<{
  mode: WorkerRunMode;
  status: "idle";
}>;

@Injectable()
export class WorkerRunner {
  private readonly logger: ControlPlaneLogger;

  public constructor(
    @Inject(ControlPlaneConfigService)
    private readonly configService: ControlPlaneConfigService,
    @Inject(CONTROL_PLANE_LOGGER) logger: ControlPlaneLogger,
  ) {
    this.logger = logger.child("worker");
  }

  public run(mode: WorkerRunMode): WorkerRunResult {
    const summary = this.configService.getSafeSummary();

    this.logger.info("Worker booted", {
      controlPlaneMode: summary.mode,
      workerMode: mode,
    });

    return {
      mode,
      status: "idle",
    };
  }
}
