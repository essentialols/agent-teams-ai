import { createSafeError } from "@agent-teams-control-plane/shared";

import type { GitHubAppSetupSettings } from "../../application/ports/github-app-settings.js";
import type {
  GitHubUserTokenExchange,
  TransientGitHubUserToken,
} from "../../application/ports/github-oauth.port.js";

export class GitHubOAuthHttpUserTokenExchange implements GitHubUserTokenExchange {
  public constructor(private readonly settings: GitHubAppSetupSettings) {}

  public async exchangeCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<TransientGitHubUserToken> {
    const settings = this.settings.requireOAuthSettings();
    const response = await fetch("https://github.com/login/oauth/access_token", {
      body: new URLSearchParams({
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        code: input.code,
        code_verifier: input.codeVerifier,
        redirect_uri: input.redirectUri,
      }),
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });
    if (!response.ok) {
      throw createSafeError({
        category: "external",
        code: "CONTROL_PLANE_GITHUB_OAUTH_EXCHANGE_FAILED",
        message: "GitHub OAuth code exchange failed.",
        retryable: response.status >= 500,
      });
    }

    const body = (await response.json()) as Record<string, unknown>;
    if (typeof body.error === "string") {
      throw createSafeError({
        category: "external",
        code: "CONTROL_PLANE_GITHUB_OAUTH_REJECTED",
        message: "GitHub OAuth code exchange was rejected.",
      });
    }
    if (typeof body.access_token !== "string") {
      throw createSafeError({
        category: "external",
        code: "CONTROL_PLANE_GITHUB_OAUTH_TOKEN_MISSING",
        message: "GitHub OAuth response did not include a user token.",
      });
    }

    return {
      accessToken: body.access_token,
      refreshTokenReceived: typeof body.refresh_token === "string",
      tokenType: typeof body.token_type === "string" ? body.token_type : "bearer",
      ...(typeof body.scope === "string" ? { scope: body.scope } : {}),
    };
  }
}
