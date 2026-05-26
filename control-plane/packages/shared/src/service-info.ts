export const CONTROL_PLANE_SERVICE_NAME = "agent-teams-control-plane";
export const CONTROL_PLANE_SERVICE_VERSION = "0.0.0";

export type ControlPlaneServiceInfo = Readonly<{
  name: typeof CONTROL_PLANE_SERVICE_NAME;
  version: typeof CONTROL_PLANE_SERVICE_VERSION;
}>;
