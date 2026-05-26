import { Controller, Get, Inject, Res } from "@nestjs/common";

import { GetHealthReportUseCase } from "../../application/use-cases/get-health-report.use-case.js";
import {
  presentHealthReport,
  type HealthHttpResponse,
} from "../http/health-response.presenter.js";

@Controller()
export class HealthController {
  public constructor(
    @Inject(GetHealthReportUseCase)
    private readonly getHealthReport: GetHealthReportUseCase,
  ) {}

  @Get("health")
  public async getHealth(): Promise<HealthHttpResponse> {
    return presentHealthReport(await this.getHealthReport.execute());
  }

  @Get("ready")
  public async getReadiness(
    @Res({ passthrough: true }) response: { status(code: number): unknown },
  ): Promise<HealthHttpResponse> {
    const report = await this.getHealthReport.execute();
    if (report.readiness.status !== "ready") {
      response.status(503);
    }
    return presentHealthReport(report);
  }
}
