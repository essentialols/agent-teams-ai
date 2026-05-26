import { Global, Module } from "@nestjs/common";

import {
  ControlPlaneConfigService,
  PlatformConfigModule,
} from "@agent-teams-control-plane/platform-config";

import {
  DisabledEnvelopeEncryption,
  NodeCryptoEnvelopeEncryption,
} from "../envelope-encryption.js";
import { ENVELOPE_ENCRYPTION } from "../tokens.js";

@Global()
@Module({
  exports: [ENVELOPE_ENCRYPTION],
  imports: [PlatformConfigModule],
  providers: [
    {
      inject: [ControlPlaneConfigService],
      provide: ENVELOPE_ENCRYPTION,
      useFactory: (configService: ControlPlaneConfigService) => {
        const masterKey = configService.getConfig().secrets.encryptionMasterKey;
        if (masterKey === undefined) {
          return new DisabledEnvelopeEncryption();
        }
        return new NodeCryptoEnvelopeEncryption(masterKey);
      },
    },
  ],
})
export class PlatformCryptoModule {}
