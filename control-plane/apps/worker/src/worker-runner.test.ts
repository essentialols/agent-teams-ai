import { describe, expect, it } from "vitest";

import type { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";
import type { ControlPlaneLogger } from "@agent-teams-control-plane/platform-logger";
import type { OutboxWorkerService } from "@agent-teams-control-plane/features-outbox/interface/nest";

import { WorkerRunner } from "./worker-runner.js";

describe("WorkerRunner", () => {
  it("boots in smoke mode without side effects", async () => {
    const logger = createSilentLogger();
    const configService = {
      getSafeSummary: () => ({
        build: {
          createdAtConfigured: false,
          revisionConfigured: false,
        },
        environment: "test",
        github: {
          appIdConfigured: false,
          appSlugConfigured: false,
          oauthClientIdConfigured: false,
          oauthClientSecretConfigured: false,
          encryptionMasterKeyConfigured: false,
          privateKeyConfigured: false,
          restApiVersionConfigured: false,
          webhookSecretConfigured: false,
        },
        http: { host: "127.0.0.1", port: 3030 },
        mode: "local-disabled",
        database: {
          poolMax: 5,
          sslMode: "disable",
          urlConfigured: false,
        },
        outbox: {
          batchSize: 10,
          leaseSeconds: 300,
          maxAttempts: 10,
          pollIntervalMs: 1000,
          workerEnabled: false,
        },
        persistence: { enabled: false },
        publicBaseUrlConfigured: false,
        retention: {
          completedOutboxConfigured: false,
          deadLetterConfigured: false,
          externalContentConfigured: false,
        },
      }),
    } satisfies Pick<ControlPlaneConfigService, "getSafeSummary">;
    const outboxWorker = {
      runOnce: async () => ({
        claimed: 0,
        completed: 0,
        deadLettered: 0,
        retried: 0,
        skipped: true,
        staleClaims: 0,
      }),
    } satisfies Pick<OutboxWorkerService, "runOnce">;

    const runner = new WorkerRunner(
      configService as ControlPlaneConfigService,
      outboxWorker as OutboxWorkerService,
      logger,
    );

    await expect(runner.run("smoke")).resolves.toEqual({
      mode: "smoke",
      outboxSkipped: true,
      status: "idle",
    });
  });
});

function createSilentLogger(): ControlPlaneLogger {
  return {
    child: () => createSilentLogger(),
    debug: () => undefined,
    error: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  };
}
