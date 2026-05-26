import { Module } from "@nestjs/common";

import { WorkspaceIdentityModule } from "@agent-teams-control-plane/features-workspace-identity/interface/nest";
import { PlatformDatabaseModule } from "@agent-teams-control-plane/platform-database/nest";

import type { IntegrationConnectionRepository } from "../../application/ports/integration-connection.repository.js";
import { ListIntegrationConnectionsUseCase } from "../../application/use-cases/list-integration-connections.use-case.js";
import { PrismaIntegrationConnectionRepository } from "../../infrastructure/prisma/prisma-integration-connection.repository.js";
import { IntegrationConnectionsController } from "./integration-connections.controller.js";
import { INTEGRATION_CONNECTION_REPOSITORY } from "./tokens.js";

@Module({
  controllers: [IntegrationConnectionsController],
  exports: [INTEGRATION_CONNECTION_REPOSITORY],
  imports: [PlatformDatabaseModule, WorkspaceIdentityModule],
  providers: [
    PrismaIntegrationConnectionRepository,
    {
      provide: INTEGRATION_CONNECTION_REPOSITORY,
      useExisting: PrismaIntegrationConnectionRepository,
    },
    {
      inject: [INTEGRATION_CONNECTION_REPOSITORY],
      provide: ListIntegrationConnectionsUseCase,
      useFactory: (repository: IntegrationConnectionRepository) =>
        new ListIntegrationConnectionsUseCase(repository),
    },
  ],
})
export class IntegrationConnectionsModule {}
