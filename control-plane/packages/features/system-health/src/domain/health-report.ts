export type HealthStatus = "ok";
export type HealthControlPlaneMode =
  | "local-disabled"
  | "hosted-official-app"
  | "self-hosted-byo-app";

export type HealthReport = Readonly<{
  service: Readonly<{
    name: string;
    version: string;
  }>;
  status: HealthStatus;
  mode: HealthControlPlaneMode;
  uptimeSeconds: number;
  configuration: Readonly<{
    publicBaseUrlConfigured: boolean;
    githubRestApiVersionConfigured: boolean;
  }>;
}>;
