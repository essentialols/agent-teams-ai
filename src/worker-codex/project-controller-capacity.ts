import { join } from "node:path";

import { LocalFileWorkerAccountCapacityStore } from "@vioxen/subscription-runtime/store-local-file";
import type { WorkerRuntimeDemand } from "@vioxen/subscription-runtime/worker-core";

export type ProjectControllerRuntimeConfig = {
  readonly model?: string;
  readonly reasoningEffort?: string;
  readonly serviceTier?: string;
  readonly quotaCooldownMs?: number;
};

export type ProjectControllerCapacityRun = {
  readonly status?: string;
  readonly safeMessage?: string;
  readonly capacityAccountId?: string;
  readonly capacityDemand?: WorkerRuntimeDemand;
};

export type RecordProjectControllerCapacitySignalInput = {
  readonly stateRootDir: string;
  readonly controllerJobId: string;
  readonly config: ProjectControllerRuntimeConfig;
  readonly run: ProjectControllerCapacityRun;
  readonly observedAt?: Date;
};

export function projectControllerCapacityDemand(
  config: ProjectControllerRuntimeConfig,
): WorkerRuntimeDemand {
  return {
    provider: "codex",
    ...(config.model === undefined ? {} : { model: config.model }),
    ...(config.reasoningEffort === undefined
      ? {}
      : { reasoningEffort: config.reasoningEffort }),
    ...(config.serviceTier === undefined
      ? {}
      : { serviceTier: config.serviceTier }),
  };
}

export function recordProjectControllerCapacitySignal(
  input: RecordProjectControllerCapacitySignalInput,
): boolean {
  if (input.run.status !== "failed") return false;
  if (!input.run.capacityAccountId) return false;
  if (!isProjectControllerQuotaFailure(input.run.safeMessage)) return false;

  const observedAt = input.observedAt ?? new Date();
  new LocalFileWorkerAccountCapacityStore({
    rootDir: join(input.stateRootDir, "worker-account-capacity"),
  }).observe({
    accountId: input.run.capacityAccountId,
    demand: input.run.capacityDemand ?? projectControllerCapacityDemand(input.config),
    capacity: {
      availability: "cooldown",
      reason: "quota_limited",
      cooldownUntil: new Date(
        observedAt.getTime() + (input.config.quotaCooldownMs ?? 15 * 60 * 1000),
      ),
    },
    observedAt,
    sourceWorkerId: input.controllerJobId,
  });
  return true;
}

export function isProjectControllerQuotaFailure(
  safeMessage: string | undefined,
): boolean {
  return /\b(?:quota|billing limit|usage limit|rate limit)\b/i.test(
    safeMessage ?? "",
  );
}
