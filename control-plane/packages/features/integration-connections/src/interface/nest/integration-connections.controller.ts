import { Controller, Get, Inject, Req } from "@nestjs/common";

import { AuthenticateDesktopClientUseCase } from "@agent-teams-control-plane/features-workspace-identity";
import {
  extractDesktopBearerToken,
  type DesktopAuthRequestLike,
} from "@agent-teams-control-plane/features-workspace-identity/interface/nest";

import { ListIntegrationConnectionsUseCase } from "../../application/use-cases/list-integration-connections.use-case.js";

@Controller("api/desktop/v1/integrations")
export class IntegrationConnectionsController {
  public constructor(
    @Inject(AuthenticateDesktopClientUseCase)
    private readonly authenticateDesktopClient: AuthenticateDesktopClientUseCase,
    @Inject(ListIntegrationConnectionsUseCase)
    private readonly listIntegrationConnections: ListIntegrationConnectionsUseCase,
  ) {}

  @Get("github/connections")
  public async listGitHubConnections(@Req() request: DesktopAuthRequestLike) {
    const actor = await this.authenticateDesktopClient.require(
      extractDesktopBearerToken(request),
    );
    return { connections: await this.listIntegrationConnections.execute(actor) };
  }
}
