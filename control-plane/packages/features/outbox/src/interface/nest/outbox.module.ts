import { Module } from "@nestjs/common";

import { PlatformDatabaseModule } from "@agent-teams-control-plane/platform-database/nest";
import { PlatformLoggerModule } from "@agent-teams-control-plane/platform-logger";
import { PlatformConfigModule } from "@agent-teams-control-plane/platform-config";

import type { OutboxHandlerRegistry } from "../../application/ports/outbox-handler.js";
import type { OutboxRepository } from "../../application/ports/outbox.repository.js";
import {
  OUTBOX_HANDLER_REGISTRY,
  OUTBOX_REPOSITORY,
} from "../../application/ports/outbox.tokens.js";
import { AppendOutboxEventUseCase } from "../../application/use-cases/append-outbox-event.use-case.js";
import { ProcessOutboxBatchUseCase } from "../../application/use-cases/process-outbox-batch.use-case.js";
import { PrismaOutboxRepository } from "../../infrastructure/prisma/prisma-outbox.repository.js";
import { NoopOutboxHandlerRegistry } from "../../infrastructure/worker/noop-outbox-handler-registry.js";
import { OutboxWorkerService } from "../../infrastructure/worker/outbox-worker.service.js";

@Module({
  exports: [AppendOutboxEventUseCase, ProcessOutboxBatchUseCase, OutboxWorkerService],
  imports: [PlatformConfigModule, PlatformDatabaseModule, PlatformLoggerModule],
  providers: [
    PrismaOutboxRepository,
    {
      provide: OUTBOX_REPOSITORY,
      useExisting: PrismaOutboxRepository,
    },
    {
      provide: OUTBOX_HANDLER_REGISTRY,
      useClass: NoopOutboxHandlerRegistry,
    },
    {
      inject: [OUTBOX_REPOSITORY],
      provide: AppendOutboxEventUseCase,
      useFactory: (repository: OutboxRepository) =>
        new AppendOutboxEventUseCase(repository),
    },
    {
      inject: [OUTBOX_REPOSITORY, OUTBOX_HANDLER_REGISTRY],
      provide: ProcessOutboxBatchUseCase,
      useFactory: (repository: OutboxRepository, handlers: OutboxHandlerRegistry) =>
        new ProcessOutboxBatchUseCase(repository, handlers),
    },
    OutboxWorkerService,
  ],
})
export class OutboxModule {}
