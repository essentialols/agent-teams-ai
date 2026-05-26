import { describe, expect, it } from "vitest";

import { GetHealthReportUseCase } from "./get-health-report.use-case.js";

describe("GetHealthReportUseCase", () => {
  it("builds a health report without NestJS runtime", async () => {
    const useCase = new GetHealthReportUseCase({
      read: async () => ({
        build: {
          createdAt: "2026-05-26T10:20:30.000Z",
          revision: "abc123",
        },
        database: {
          enabled: false,
          migrationStatus: "not-checked",
          status: "disabled",
        },
        githubRestApiVersionConfigured: false,
        mode: "local-disabled",
        publicBaseUrlConfigured: false,
        uptimeSeconds: 12,
      }),
    });

    await expect(useCase.execute()).resolves.toEqual({
      configuration: {
        githubRestApiVersionConfigured: false,
        publicBaseUrlConfigured: false,
      },
      mode: "local-disabled",
      readiness: {
        database: {
          enabled: false,
          migrationStatus: "not-checked",
          status: "disabled",
        },
        status: "ready",
      },
      service: {
        build: {
          createdAt: "2026-05-26T10:20:30.000Z",
          revision: "abc123",
        },
        name: "agent-teams-control-plane",
        version: "0.0.0",
      },
      status: "ok",
      uptimeSeconds: 12,
    });
  });
});
