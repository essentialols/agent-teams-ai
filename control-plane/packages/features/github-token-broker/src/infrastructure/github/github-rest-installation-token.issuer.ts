import { createSafeError, toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { GitHubAppJwtSigner } from "../../application/ports/github-app-jwt-signer.port.js";
import type {
  GitHubInstallationTokenIssuer,
  GitHubInstallationTokenIssuerInput,
  GitHubInstallationTokenIssuerResult,
} from "../../application/ports/github-installation-token-issuer.port.js";
import type { GitHubTokenBrokerSettings } from "../../application/ports/policies.js";
import type {
  GitHubPermissionLevel,
  GitHubPermissionSet,
  GitHubRepositoryJsonId,
} from "../../domain/index.js";

type FetchLike = typeof fetch;

type GitHubTokenResponse = {
  token?: unknown;
  expires_at?: unknown;
  permissions?: Record<string, unknown>;
  repositories?: Array<{
    id?: unknown;
  }>;
};

export class GitHubRestInstallationTokenIssuer implements GitHubInstallationTokenIssuer {
  public constructor(
    private readonly settings: GitHubTokenBrokerSettings,
    private readonly signer: GitHubAppJwtSigner,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  public async issue(
    input: GitHubInstallationTokenIssuerInput,
  ): Promise<GitHubInstallationTokenIssuerResult> {
    const jwt = await this.signer.sign({ nowMs: input.nowMs });
    const response = await this.fetchFn(
      `https://api.github.com/app/installations/${encodeURIComponent(
        input.githubInstallationId,
      )}/access_tokens`,
      {
        body: JSON.stringify({
          permissions: input.permissions,
          repository_ids: input.repositoryIds,
        }),
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${jwt.value}`,
          "content-type": "application/json",
          ...(this.settings.restApiVersion() === undefined
            ? {}
            : { "x-github-api-version": this.settings.restApiVersion() }),
        },
        method: "POST",
      },
    );

    if (!response.ok) {
      throw githubTokenApiError(response);
    }

    const body = (await response.json()) as GitHubTokenResponse;
    if (typeof body.token !== "string" || typeof body.expires_at !== "string") {
      throw createSafeError({
        category: "external",
        code: "CONTROL_PLANE_GITHUB_TOKEN_RESPONSE_INVALID",
        message: "GitHub installation token response was invalid.",
      });
    }
    const expiresAt = Date.parse(body.expires_at);
    if (!Number.isFinite(expiresAt)) {
      throw createSafeError({
        category: "external",
        code: "CONTROL_PLANE_GITHUB_TOKEN_EXPIRY_INVALID",
        message: "GitHub installation token expiry was invalid.",
      });
    }

    return {
      expiresAtMs: toUnixMilliseconds(expiresAt),
      token: body.token,
      ...parseGrantedPermissions(body.permissions),
      ...parseGrantedRepositoryIds(body.repositories),
    };
  }
}

function parseGrantedPermissions(value: GitHubTokenResponse["permissions"]): {
  grantedPermissions?: GitHubPermissionSet;
} {
  if (value === undefined) {
    return {};
  }
  const permissions: Record<string, GitHubPermissionLevel> = {};
  for (const [name, level] of Object.entries(value)) {
    if (level === "read" || level === "write") {
      permissions[name] = level;
    }
  }
  return { grantedPermissions: permissions };
}

function parseGrantedRepositoryIds(value: GitHubTokenResponse["repositories"]): {
  grantedRepositoryIds?: readonly GitHubRepositoryJsonId[];
} {
  if (value === undefined) {
    return {};
  }
  return {
    grantedRepositoryIds: value.flatMap((repository) =>
      typeof repository.id === "number" && Number.isSafeInteger(repository.id)
        ? [repository.id]
        : [],
    ),
  };
}

function githubTokenApiError(response: Response) {
  if (isRateLimitedResponse(response)) {
    return createSafeError({
      category: "external",
      code: "CONTROL_PLANE_GITHUB_TOKEN_RATE_LIMITED",
      message: "GitHub installation token API rate limit was reached.",
      retryable: true,
      safeDetails: rateLimitSafeDetails(response),
    });
  }
  const { status } = response;
  if (status === 401 || status === 403) {
    return createSafeError({
      category: "authorization",
      code: "CONTROL_PLANE_GITHUB_TOKEN_FORBIDDEN",
      message: "GitHub installation token request was rejected.",
    });
  }
  if (status === 422) {
    return createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_GITHUB_TOKEN_SCOPE_INVALID",
      message: "GitHub installation token scope was invalid.",
    });
  }
  return createSafeError({
    category: "external",
    code: "CONTROL_PLANE_GITHUB_TOKEN_API_UNAVAILABLE",
    message: "GitHub installation token API request failed.",
    retryable: status === 429 || status >= 500,
  });
}

function isRateLimitedResponse(response: Response): boolean {
  return (
    response.status === 429 ||
    (response.status === 403 &&
      (response.headers.has("retry-after") ||
        response.headers.get("x-ratelimit-remaining") === "0"))
  );
}

function rateLimitSafeDetails(response: Response): Record<string, number> {
  return {
    providerStatus: response.status,
    ...optionalHeaderNumber(response.headers, "retry-after", "retryAfterSeconds"),
    ...optionalHeaderNumber(
      response.headers,
      "x-ratelimit-reset",
      "rateLimitResetSeconds",
    ),
    ...optionalHeaderNumber(
      response.headers,
      "x-ratelimit-remaining",
      "rateLimitRemaining",
    ),
  };
}

function optionalHeaderNumber(
  headers: Headers,
  headerName: string,
  safeDetailName: string,
): Record<string, number> {
  const value = headers.get(headerName);
  if (value === null || !/^\d+$/.test(value)) {
    return {};
  }
  return { [safeDetailName]: Number(value) };
}
