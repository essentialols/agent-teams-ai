import type { HealthControlPlaneMode } from "../../domain/health-report.js";

export type HealthEnvironment = Readonly<{
  mode: HealthControlPlaneMode;
  publicBaseUrlConfigured: boolean;
  githubRestApiVersionConfigured: boolean;
  uptimeSeconds: number;
}>;

export interface HealthEnvironmentReader {
  read(): HealthEnvironment;
}
