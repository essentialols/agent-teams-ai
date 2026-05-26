import { Module } from "@nestjs/common";

import { ControlPlaneApiModule } from "./modules/control-plane-api.module.js";

@Module({
  imports: [ControlPlaneApiModule],
})
export class ApiAppModule {}
