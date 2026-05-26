import type { DesktopClientActor } from "@agent-teams-control-plane/features-workspace-identity";

import type { IntegrationConnection } from "../../domain/integration-connection.js";
import type { IntegrationConnectionRepository } from "../ports/integration-connection.repository.js";

export class ListIntegrationConnectionsUseCase {
  public constructor(private readonly repository: IntegrationConnectionRepository) {}

  public async execute(
    actor: DesktopClientActor,
  ): Promise<readonly IntegrationConnection[]> {
    return this.repository.listForWorkspace(actor.workspaceId);
  }
}
