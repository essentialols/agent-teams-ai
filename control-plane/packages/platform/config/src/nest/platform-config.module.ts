import { Global, Injectable, Module } from "@nestjs/common";

import {
  getSafeConfigSummary,
  loadControlPlaneConfig,
  type ControlPlaneConfig,
  type SafeControlPlaneConfigSummary,
} from "../control-plane-config.js";

@Injectable()
export class ControlPlaneConfigService {
  private readonly config = loadControlPlaneConfig();

  public getConfig(): ControlPlaneConfig {
    return this.config;
  }

  public getSafeSummary(): SafeControlPlaneConfigSummary {
    return getSafeConfigSummary(this.config);
  }
}

@Global()
@Module({
  exports: [ControlPlaneConfigService],
  providers: [ControlPlaneConfigService],
})
export class PlatformConfigModule {}
