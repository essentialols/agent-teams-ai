import { Inject, Injectable } from "@nestjs/common";

import { OutboxWorkerService } from "@agent-teams-control-plane/features-outbox/interface/nest";
import { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";
import {
  CONTROL_PLANE_LOGGER,
  type ControlPlaneLogger,
} from "@agent-teams-control-plane/platform-logger";

export type WorkerRunMode = "serve" | "smoke";

export type WorkerRunResult = Readonly<{
  mode: WorkerRunMode;
  status: "idle" | "processed-once";
  outboxSkipped: boolean;
}>;

@Injectable()
export class WorkerRunner {
  private readonly logger: ControlPlaneLogger;

  public constructor(
    @Inject(ControlPlaneConfigService)
    private readonly configService: ControlPlaneConfigService,
    @Inject(OutboxWorkerService)
    private readonly outboxWorker: OutboxWorkerService,
    @Inject(CONTROL_PLANE_LOGGER) logger: ControlPlaneLogger,
  ) {
    this.logger = logger.child("worker");
  }

  public async run(mode: WorkerRunMode): Promise<WorkerRunResult> {
    const summary = this.configService.getSafeSummary();

    this.logger.info("Worker booted", {
      controlPlaneMode: summary.mode,
      workerMode: mode,
    });

    const outboxResult = await this.outboxWorker.runOnce();

    return {
      mode,
      outboxSkipped: outboxResult.skipped,
      status: outboxResult.skipped ? "idle" : "processed-once",
    };
  }
}
