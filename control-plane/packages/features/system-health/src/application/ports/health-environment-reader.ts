import type { ControlPlaneBuildInfo } from "@agent-teams-control-plane/shared";

import type { HealthControlPlaneMode } from "../../domain/health-report.js";

export type HealthEnvironment = Readonly<{
  build: ControlPlaneBuildInfo;
  mode: HealthControlPlaneMode;
  publicBaseUrlConfigured: boolean;
  githubRestApiVersionConfigured: boolean;
  uptimeSeconds: number;
}>;

export interface HealthEnvironmentReader {
  read(): HealthEnvironment;
}
