import { createSafeError } from "@agent-teams-control-plane/shared";
import type { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";

import type { GitHubAppSetupSettings } from "../../application/ports/github-app-settings.js";
import type {
  GitHubSetupFeature,
  GitHubSetupFeatureGatePolicy,
} from "../../application/ports/policies.js";

export class ConfigGitHubAppSetupSettings implements GitHubAppSetupSettings {
  public constructor(private readonly configService: ControlPlaneConfigService) {}

  public requireSetupSettings(): { appSlug: string; publicBaseUrl: string } {
    const config = this.configService.getConfig();
    if (config.github.appSlug === undefined || config.publicBaseUrl === undefined) {
      throw missingConfigError();
    }
    return {
      appSlug: config.github.appSlug,
      publicBaseUrl: config.publicBaseUrl,
    };
  }

  public requireOAuthSettings(): {
    clientId: string;
    clientSecret: string;
    publicBaseUrl: string;
  } {
    const config = this.configService.getConfig();
    if (
      config.github.oauthClientId === undefined ||
      config.secrets.githubOAuthClientSecret === undefined ||
      config.publicBaseUrl === undefined
    ) {
      throw missingConfigError();
    }
    return {
      clientId: config.github.oauthClientId,
      clientSecret: config.secrets.githubOAuthClientSecret,
      publicBaseUrl: config.publicBaseUrl,
    };
  }

  public restApiVersion(): string | undefined {
    return this.configService.getConfig().github.restApiVersion;
  }
}

export class ConfigGitHubSetupFeatureGatePolicy implements GitHubSetupFeatureGatePolicy {
  public constructor(private readonly configService: ControlPlaneConfigService) {}

  public assertEnabled(feature: GitHubSetupFeature): Promise<void> {
    if (!this.isEnabled(feature)) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_FEATURE_DISABLED",
        message: "Control-plane feature is disabled.",
        safeDetails: { feature },
      });
    }
    return Promise.resolve();
  }

  public isEnabled(feature: GitHubSetupFeature): boolean {
    const gates = this.configService.getConfig().featureGates;
    if (feature === "github-setup") {
      return gates.githubSetupEnabled;
    }
    if (feature === "github-claim-oauth") {
      return gates.githubClaimOAuthEnabled;
    }
    return gates.githubUnclaimedCallbackRecordingEnabled;
  }
}

function missingConfigError() {
  return createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_GITHUB_CONFIG_MISSING",
    message: "GitHub App setup configuration is incomplete.",
  });
}
