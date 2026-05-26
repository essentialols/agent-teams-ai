import { Module } from "@nestjs/common";

import {
  ENVELOPE_ENCRYPTION,
  type EnvelopeEncryptionPort,
} from "@agent-teams-control-plane/platform-crypto";
import { PlatformCryptoModule } from "@agent-teams-control-plane/platform-crypto/nest";
import { PlatformDatabaseModule } from "@agent-teams-control-plane/platform-database/nest";

import type { ExternalActionContentEncryptionPort } from "../../application/ports/external-action-content-encryption.port.js";
import type { ExternalActionContentRepository } from "../../application/ports/external-action-content.repository.js";
import { LoadExternalActionContentUseCase } from "../../application/use-cases/load-external-action-content.use-case.js";
import { ShredExternalActionContentUseCase } from "../../application/use-cases/shred-external-action-content.use-case.js";
import { StoreExternalActionContentUseCase } from "../../application/use-cases/store-external-action-content.use-case.js";
import { PrismaExternalActionContentRepository } from "../../infrastructure/prisma/prisma-external-action-content.repository.js";
import {
  EXTERNAL_ACTION_CONTENT_ENCRYPTION,
  EXTERNAL_ACTION_CONTENT_REPOSITORY,
} from "./tokens.js";

@Module({
  exports: [
    StoreExternalActionContentUseCase,
    LoadExternalActionContentUseCase,
    ShredExternalActionContentUseCase,
  ],
  imports: [PlatformCryptoModule, PlatformDatabaseModule],
  providers: [
    PrismaExternalActionContentRepository,
    {
      provide: EXTERNAL_ACTION_CONTENT_REPOSITORY,
      useExisting: PrismaExternalActionContentRepository,
    },
    {
      inject: [ENVELOPE_ENCRYPTION],
      provide: EXTERNAL_ACTION_CONTENT_ENCRYPTION,
      useFactory: (encryption: EnvelopeEncryptionPort) =>
        encryption satisfies ExternalActionContentEncryptionPort,
    },
    {
      inject: [EXTERNAL_ACTION_CONTENT_REPOSITORY, EXTERNAL_ACTION_CONTENT_ENCRYPTION],
      provide: StoreExternalActionContentUseCase,
      useFactory: (
        repository: ExternalActionContentRepository,
        encryption: ExternalActionContentEncryptionPort,
      ) => new StoreExternalActionContentUseCase(repository, encryption),
    },
    {
      inject: [EXTERNAL_ACTION_CONTENT_REPOSITORY, EXTERNAL_ACTION_CONTENT_ENCRYPTION],
      provide: LoadExternalActionContentUseCase,
      useFactory: (
        repository: ExternalActionContentRepository,
        encryption: ExternalActionContentEncryptionPort,
      ) => new LoadExternalActionContentUseCase(repository, encryption),
    },
    {
      inject: [EXTERNAL_ACTION_CONTENT_REPOSITORY],
      provide: ShredExternalActionContentUseCase,
      useFactory: (repository: ExternalActionContentRepository) =>
        new ShredExternalActionContentUseCase(repository),
    },
  ],
})
export class ExternalActionContentModule {}
