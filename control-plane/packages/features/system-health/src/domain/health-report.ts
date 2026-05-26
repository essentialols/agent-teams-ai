import type { ControlPlaneBuildInfo } from "@agent-teams-control-plane/shared";

export type HealthStatus = "ok";
export type HealthControlPlaneMode =
  | "local-disabled"
  | "hosted-official-app"
  | "self-hosted-byo-app";

export type HealthReport = Readonly<{
  service: Readonly<{
    name: string;
    version: string;
    build: ControlPlaneBuildInfo;
  }>;
  status: HealthStatus;
  mode: HealthControlPlaneMode;
  uptimeSeconds: number;
  configuration: Readonly<{
    publicBaseUrlConfigured: boolean;
    githubRestApiVersionConfigured: boolean;
  }>;
}>;
