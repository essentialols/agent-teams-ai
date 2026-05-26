import { Body, Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";

import {
  AuthenticateDesktopClientUseCase,
  BootstrapWorkspaceUseCase,
  CompleteDesktopPairingUseCase,
  RevokeDesktopClientUseCase,
  RotateDesktopClientTokenUseCase,
  StartDesktopPairingUseCase,
} from "../../index.js";
import {
  extractDesktopBearerToken,
  type DesktopAuthRequestLike,
} from "./desktop-auth.js";

@Controller("api/desktop/v1")
export class WorkspaceIdentityController {
  public constructor(
    @Inject(AuthenticateDesktopClientUseCase)
    private readonly authenticateDesktopClient: AuthenticateDesktopClientUseCase,
    @Inject(BootstrapWorkspaceUseCase)
    private readonly bootstrapWorkspace: BootstrapWorkspaceUseCase,
    @Inject(StartDesktopPairingUseCase)
    private readonly startDesktopPairing: StartDesktopPairingUseCase,
    @Inject(CompleteDesktopPairingUseCase)
    private readonly completeDesktopPairing: CompleteDesktopPairingUseCase,
    @Inject(RotateDesktopClientTokenUseCase)
    private readonly rotateDesktopClientToken: RotateDesktopClientTokenUseCase,
    @Inject(RevokeDesktopClientUseCase)
    private readonly revokeDesktopClient: RevokeDesktopClientUseCase,
  ) {}

  @Post("workspaces/bootstrap")
  public async bootstrap(
    @Body() body: { desktopDisplayName?: string; workspaceDisplayName?: string },
  ) {
    const desktopDisplayName = readOptionalString(body.desktopDisplayName);
    const workspaceDisplayName = readOptionalString(body.workspaceDisplayName);
    return this.bootstrapWorkspace.execute({
      ...(desktopDisplayName === undefined ? {} : { desktopDisplayName }),
      ...(workspaceDisplayName === undefined ? {} : { workspaceDisplayName }),
    });
  }

  @Get("me")
  public async me(@Req() request: DesktopAuthRequestLike) {
    const actor = await this.authenticateDesktopClient.require(
      extractDesktopBearerToken(request),
    );
    return actor;
  }

  @Post("pairing/start")
  public async startPairing(@Req() request: DesktopAuthRequestLike) {
    const actor = await this.authenticateDesktopClient.require(
      extractDesktopBearerToken(request),
    );
    return this.startDesktopPairing.execute(actor);
  }

  @Post("pairing/complete")
  public async completePairing(
    @Body() body: { pairingCode?: string; desktopDisplayName?: string },
  ) {
    const desktopDisplayName = readOptionalString(body.desktopDisplayName);
    return this.completeDesktopPairing.execute({
      ...(desktopDisplayName === undefined ? {} : { desktopDisplayName }),
      pairingCode: readRequiredString(body.pairingCode),
    });
  }

  @Post("clients/:desktopClientId/rotate-token")
  public async rotateToken(
    @Param("desktopClientId") desktopClientId: string,
    @Body() body: { rotationRequestId?: string },
    @Req() request: DesktopAuthRequestLike,
  ) {
    const actor = await this.authenticateDesktopClient.require(
      extractDesktopBearerToken(request),
    );
    const rotationRequestId = readOptionalString(body.rotationRequestId);
    return this.rotateDesktopClientToken.execute({
      actor,
      desktopClientId,
      ...(rotationRequestId === undefined ? {} : { rotationRequestId }),
    });
  }

  @Post("clients/:desktopClientId/revoke")
  public async revoke(
    @Param("desktopClientId") desktopClientId: string,
    @Req() request: DesktopAuthRequestLike,
  ) {
    const actor = await this.authenticateDesktopClient.require(
      extractDesktopBearerToken(request),
    );
    await this.revokeDesktopClient.execute({ actor, desktopClientId });
    return { revoked: true };
  }
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readRequiredString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
