import { describe, expect, it } from "vitest";

import { GitHubRestActionDispatcher } from "./github-rest-action.dispatcher.js";

describe("GitHubRestActionDispatcher", () => {
  it("creates issue comments with pinned GitHub API headers", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const dispatcher = new GitHubRestActionDispatcher(settings(), async (url, init) => {
      calls.push({ init: init ?? {}, url: String(url) });
      return new Response(
        JSON.stringify({
          html_url: "https://github.com/octo/repo/issues/7#issuecomment-1",
          id: 123,
        }),
        {
          headers: { "x-github-request-id": "request-1" },
          status: 201,
        },
      );
    });

    await expect(
      dispatcher.dispatch({
        actionRequestId: "action-1",
        actionType: "github.issue_comment.create",
        payload: { body: "raw", issueNumber: 7 },
        renderedBody: "rendered body",
        target: { owner: "octo", repo: "repo" },
        tokenLease: {
          expiresAtMs: 1000,
          githubInstallationId: "installation-1",
          token: "secret-token",
        },
      }),
    ).resolves.toMatchObject({
      githubDeliveryId: "123",
      githubRequestId: "request-1",
      githubStatusCode: 201,
      githubUrl: "https://github.com/octo/repo/issues/7#issuecomment-1",
      kind: "success",
    });
    expect(calls[0]?.url).toBe(
      "https://api.github.com/repos/octo/repo/issues/7/comments",
    );
    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.init.headers).toMatchObject({
      "X-GitHub-Api-Version": "2022-11-28",
    });
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ body: "rendered body" });
  });

  it("maps GitHub retry-after responses to retryable safe failures", async () => {
    const dispatcher = new GitHubRestActionDispatcher(
      settings(),
      async () =>
        new Response(JSON.stringify({ message: "secondary rate limit" }), {
          headers: {
            "retry-after": "120",
            "x-github-request-id": "request-2",
          },
          status: 403,
        }),
    );

    await expect(
      dispatcher.dispatch({
        actionRequestId: "action-1",
        actionType: "github.issue_comment.create",
        payload: { body: "raw", issueNumber: 7 },
        renderedBody: "rendered body",
        target: { owner: "octo", repo: "repo" },
        tokenLease: {
          expiresAtMs: 1000,
          githubInstallationId: "installation-1",
          token: "secret-token",
        },
      }),
    ).resolves.toMatchObject({
      kind: "failure",
      retryAfterMs: 120_000,
      safeError: {
        code: "CONTROL_PLANE_GITHUB_ACTION_RATE_LIMITED",
        retryable: true,
      },
    });
  });
});

function settings() {
  return {
    agentAvatarAllowedOrigins: () => [],
    defaultAgentAvatarUrl: () => undefined,
    externalContentRetentionDays: () => undefined,
    githubRestApiVersion: () => "2022-11-28",
  };
}
