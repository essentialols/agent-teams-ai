import { createSafeError } from "@agent-teams-control-plane/shared";
import type { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";

import type {
  WorkspaceIdentityFeature,
  WorkspaceIdentityFeatureGatePolicy,
} from "../../application/ports/policies.js";

export class ConfigWorkspaceIdentityFeatureGatePolicy implements WorkspaceIdentityFeatureGatePolicy {
  public constructor(private readonly configService: ControlPlaneConfigService) {}

  public async assertEnabled(feature: WorkspaceIdentityFeature): Promise<void> {
    const gates = this.configService.getConfig().featureGates;
    const enabled =
      feature === "desktop-bootstrap"
        ? gates.desktopBootstrapEnabled
        : gates.desktopPairingEnabled;
    if (!enabled) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_FEATURE_DISABLED",
        message: "Control-plane feature is disabled.",
        safeDetails: { feature },
      });
    }
  }
}
