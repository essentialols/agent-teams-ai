import type { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";

import type {
  GitHubTokenBrokerFeature,
  GitHubTokenBrokerFeatureGatePolicy,
  GitHubTokenBrokerReadinessSnapshot,
  GitHubTokenBrokerSettings,
} from "../../application/ports/policies.js";
import { githubTokenBrokerFeatureDisabledError } from "../../application/ports/policies.js";

export class ConfigGitHubTokenBrokerFeatureGatePolicy implements GitHubTokenBrokerFeatureGatePolicy {
  public constructor(private readonly configService: ControlPlaneConfigService) {}

  public assertEnabled(feature: GitHubTokenBrokerFeature): Promise<void> {
    if (!this.isEnabled(feature)) {
      throw githubTokenBrokerFeatureDisabledError(feature);
    }
    return Promise.resolve();
  }

  public isEnabled(feature: GitHubTokenBrokerFeature): boolean {
    void feature;
    return this.configService.getConfig().featureGates.githubTokenBrokerEnabled;
  }
}

export class ConfigGitHubTokenBrokerSettings implements GitHubTokenBrokerSettings {
  public constructor(private readonly configService: ControlPlaneConfigService) {}

  public appJwtIssuer(): string | undefined {
    const config = this.configService.getConfig();
    return config.github.appClientId ?? config.github.appId;
  }

  public privateKey(): string | undefined {
    return this.configService.getConfig().secrets.githubPrivateKey;
  }

  public restApiVersion(): string | undefined {
    return this.configService.getConfig().github.restApiVersion;
  }

  public readinessSnapshot(): GitHubTokenBrokerReadinessSnapshot {
    const config = this.configService.getConfig();
    return {
      appClientIdConfigured: config.github.appClientId !== undefined,
      appIdConfigured: config.github.appId !== undefined,
      appSlugConfigured: config.github.appSlug !== undefined,
      mode: config.mode,
      privateKeyConfigured: config.secrets.githubPrivateKey !== undefined,
      publicBaseUrlConfigured: config.publicBaseUrl !== undefined,
      restApiVersionConfigured: config.github.restApiVersion !== undefined,
    };
  }
}
