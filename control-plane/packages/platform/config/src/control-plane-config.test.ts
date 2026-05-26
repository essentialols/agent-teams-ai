import { describe, expect, it } from "vitest";

import {
  ControlPlaneConfigError,
  getSafeConfigSummary,
  loadControlPlaneConfig,
} from "./control-plane-config.js";

describe("loadControlPlaneConfig", () => {
  it("loads local-disabled mode without hosted secrets", () => {
    const config = loadControlPlaneConfig({ NODE_ENV: "test" });

    expect(config.mode).toBe("local-disabled");
    expect(config.http).toEqual({ host: "127.0.0.1", port: 3030 });
    expect(config.github).toEqual({});
    expect(config.secrets).toEqual({});
  });

  it("fails closed when hosted mode is missing required GitHub settings", () => {
    expect(() =>
      loadControlPlaneConfig({
        CONTROL_PLANE_MODE: "hosted-official-app",
        NODE_ENV: "test",
      }),
    ).toThrow(ControlPlaneConfigError);
  });

  it("returns a safe summary without secret values", () => {
    const config = loadControlPlaneConfig({
      CONTROL_PLANE_GITHUB_APP_ID: "123",
      CONTROL_PLANE_GITHUB_APP_SLUG: "agent-teams",
      CONTROL_PLANE_GITHUB_OAUTH_CLIENT_ID: "client-id",
      CONTROL_PLANE_GITHUB_OAUTH_CLIENT_SECRET: "oauth-secret",
      CONTROL_PLANE_GITHUB_PRIVATE_KEY: "private-key",
      CONTROL_PLANE_GITHUB_REST_API_VERSION: "2099-01-01",
      CONTROL_PLANE_GITHUB_WEBHOOK_SECRET: "webhook-secret",
      CONTROL_PLANE_MODE: "hosted-official-app",
      CONTROL_PLANE_PUBLIC_BASE_URL: "https://control-plane.example.test",
      NODE_ENV: "test",
    });

    const summary = getSafeConfigSummary(config);

    expect(summary.github.privateKeyConfigured).toBe(true);
    expect(JSON.stringify(summary)).not.toContain("private-key");
    expect(JSON.stringify(summary)).not.toContain("webhook-secret");
    expect(JSON.stringify(summary)).not.toContain("oauth-secret");
  });
});
