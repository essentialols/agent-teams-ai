import { Controller, Get, Inject } from "@nestjs/common";

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
  public getHealth(): HealthHttpResponse {
    return presentHealthReport(this.getHealthReport.execute());
  }
}
