import { Body, Controller, Get, Inject, Param, Post, Query, Req } from "@nestjs/common";

import { AuthenticateDesktopClientUseCase } from "@agent-teams-control-plane/features-workspace-identity";
import {
  extractDesktopBearerToken,
  type DesktopAuthRequestLike,
} from "@agent-teams-control-plane/features-workspace-identity/interface/nest";

import { CompleteGitHubClaimOAuthUseCase } from "../../application/use-cases/complete-github-claim-oauth.use-case.js";
import { GetGitHubSetupStatusUseCase } from "../../application/use-cases/get-github-setup-status.use-case.js";
import { HandleGitHubSetupCallbackUseCase } from "../../application/use-cases/handle-github-setup-callback.use-case.js";
import { StartGitHubClaimOAuthUseCase } from "../../application/use-cases/start-github-claim-oauth.use-case.js";
import { StartGitHubInstallationSetupUseCase } from "../../application/use-cases/start-github-installation-setup.use-case.js";

@Controller()
export class GitHubInstallationSetupController {
  public constructor(
    @Inject(AuthenticateDesktopClientUseCase)
    private readonly authenticateDesktopClient: AuthenticateDesktopClientUseCase,
    @Inject(StartGitHubInstallationSetupUseCase)
    private readonly startSetup: StartGitHubInstallationSetupUseCase,
    @Inject(GetGitHubSetupStatusUseCase)
    private readonly getSetupStatus: GetGitHubSetupStatusUseCase,
    @Inject(HandleGitHubSetupCallbackUseCase)
    private readonly handleSetupCallback: HandleGitHubSetupCallbackUseCase,
    @Inject(StartGitHubClaimOAuthUseCase)
    private readonly startClaimOAuth: StartGitHubClaimOAuthUseCase,
    @Inject(CompleteGitHubClaimOAuthUseCase)
    private readonly completeClaimOAuth: CompleteGitHubClaimOAuthUseCase,
  ) {}

  @Post("api/desktop/v1/integrations/github/setup/start")
  public async startGitHubSetup(@Req() request: DesktopAuthRequestLike) {
    const actor = await this.authenticateDesktopClient.require(
      extractDesktopBearerToken(request),
    );
    return this.startSetup.execute(actor);
  }

  @Get("api/desktop/v1/integrations/github/setup/:setupSessionId")
  public async getGitHubSetupStatus(
    @Param("setupSessionId") setupSessionId: string,
    @Req() request: DesktopAuthRequestLike,
  ) {
    const actor = await this.authenticateDesktopClient.require(
      extractDesktopBearerToken(request),
    );
    return this.getSetupStatus.execute({ actor, setupSessionId });
  }

  @Get("api/public/github/setup")
  public async publicSetupCallback(@Query() query: Record<string, unknown>) {
    const installationId = singleQueryString(query.installation_id);
    const state = singleQueryString(query.state);
    const result = await this.handleSetupCallback.execute({
      ...(installationId === undefined ? {} : { installationId }),
      ...(state === undefined ? {} : { state }),
    });
    if (result.kind === "untrusted-callback") {
      return {
        status: "restart_required",
      };
    }
    return {
      claimContinuationToken: result.claimContinuationToken,
      claimId: result.claimId,
      setupSessionId: result.setupSessionId,
      status: "pending_claim",
    };
  }

  @Post("api/public/github/claim/:claimId/start")
  public async startPublicClaimOAuth(
    @Param("claimId") claimId: string,
    @Body() body: { claimContinuationToken?: string },
  ) {
    const claimContinuationToken = singleBodyString(body.claimContinuationToken);
    return this.startClaimOAuth.execute({
      claimId,
      ...(claimContinuationToken === undefined ? {} : { claimContinuationToken }),
    });
  }

  @Get("api/public/github/oauth/callback")
  public async publicOAuthCallback(@Query() query: Record<string, unknown>) {
    const code = singleQueryString(query.code);
    const providerErrorCode = singleQueryString(query.error);
    const state = singleQueryString(query.state);
    return this.completeClaimOAuth.execute({
      duplicateParameter:
        hasDuplicate(query.code) ||
        hasDuplicate(query.state) ||
        hasDuplicate(query.error),
      ...(code === undefined ? {} : { code }),
      ...(providerErrorCode === undefined ? {} : { providerErrorCode }),
      ...(state === undefined ? {} : { state }),
    });
  }
}

function singleQueryString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.length === 1 && typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function singleBodyString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function hasDuplicate(value: unknown): boolean {
  return Array.isArray(value) && value.length > 1;
}
