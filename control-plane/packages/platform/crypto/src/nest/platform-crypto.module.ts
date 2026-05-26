import { Global, Module } from "@nestjs/common";

import {
  ControlPlaneConfigService,
  PlatformConfigModule,
} from "@agent-teams-control-plane/platform-config";

import {
  DisabledCredentialHasher,
  NodeCryptoCredentialHasher,
  type CredentialHasher,
} from "../credential-hashing.js";
import {
  DisabledEnvelopeEncryption,
  NodeCryptoEnvelopeEncryption,
  type EnvelopeEncryptionPort,
} from "../envelope-encryption.js";
import { CREDENTIAL_HASHER, ENVELOPE_ENCRYPTION } from "../tokens.js";

@Global()
@Module({
  exports: [CREDENTIAL_HASHER, ENVELOPE_ENCRYPTION],
  imports: [PlatformConfigModule],
  providers: [
    {
      inject: [ControlPlaneConfigService],
      provide: ENVELOPE_ENCRYPTION,
      useFactory: (configService: ControlPlaneConfigService): EnvelopeEncryptionPort => {
        const masterKey = configService.getConfig().secrets.encryptionMasterKey;
        if (masterKey === undefined) {
          return new DisabledEnvelopeEncryption();
        }
        return new NodeCryptoEnvelopeEncryption(masterKey);
      },
    },
    {
      inject: [ControlPlaneConfigService],
      provide: CREDENTIAL_HASHER,
      useFactory: (configService: ControlPlaneConfigService): CredentialHasher => {
        const masterKey = configService.getConfig().secrets.encryptionMasterKey;
        if (masterKey === undefined) {
          return new DisabledCredentialHasher();
        }
        return new NodeCryptoCredentialHasher(masterKey);
      },
    },
  ],
})
export class PlatformCryptoModule {}
