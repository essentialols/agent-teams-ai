import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import {
  isSchedulerEligible,
  recommendedActionForAvailability,
  workerCapacityToDiagnosticSignal,
  type ProviderAccountAction,
  type ProviderAccountAvailability,
} from "@vioxen/subscription-runtime/account-diagnostics";
import {
  readCodexAuthJsonFreshness,
  validateCodexAuthJsonBytes,
} from "@vioxen/subscription-runtime/provider-codex";
import { LocalFileWorkerAccountCapacityStore } from "@vioxen/subscription-runtime/store-local-file";
import type { WorkerCapacitySnapshot } from "@vioxen/subscription-runtime/worker-core";
import {
  codexAccountDisplayMetadataForSlot,
  readCodexAccountDisplayMetadata,
  type CodexAccountDisplayMetadata,
} from "./account-display-metadata";

const execFileAsync = promisify(execFile);

export type CodexGoalAccountStatus =
  | "ready"
  | "auth_missing"
  | "auth_invalid";

export type CodexGoalAccountSlotStatus = {
  readonly name: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly shortName?: string;
  readonly operatorLabel?: string;
  readonly authJsonPath: string;
  readonly status: CodexGoalAccountStatus;
  readonly availability: ProviderAccountAvailability;
  readonly schedulerEligible: boolean;
  readonly recommendedAction: ProviderAccountAction;
  readonly byteLength?: number;
  readonly authJsonSha256Prefix?: string;
  readonly identitySource?: string;
  readonly identityHashPrefix?: string;
  readonly lastRefreshAt?: string;
  readonly expiresAt?: string;
  readonly limitResetAt?: string;
  readonly capacityAvailability?: string;
  readonly capacityReason?: string;
  readonly capacityCooldownUntil?: string;
  readonly capacityLastLimitSignalAt?: string;
  readonly liveCheck?: "passed" | "failed";
  readonly liveCheckSafeMessage?: string;
  readonly warnings: readonly string[];
  readonly safeMessage: string;
};

export type CodexGoalAccountStatusInput = {
  readonly authRootDir: string;
  readonly accounts?: readonly string[];
  readonly stateRootDir?: string;
  readonly liveCheck?: boolean;
  readonly codexBinaryPath?: string;
  readonly liveCheckTimeoutMs?: number;
  readonly accountMetadata?: Readonly<Record<string, CodexAccountDisplayMetadata>>;
};

export async function listCodexGoalAccountStatuses(
  input: CodexGoalAccountStatusInput,
): Promise<readonly CodexGoalAccountSlotStatus[]> {
  const accountNames = input.accounts?.length
    ? input.accounts
    : await listAccountDirectories(input.authRootDir);
  const accountMetadata = {
    ...(await readCodexAccountDisplayMetadata(input.authRootDir)),
    ...(input.accountMetadata ?? {}),
  };
  return Promise.all(
    accountNames.map((name) =>
      inspectCodexGoalAccount({
        authRootDir: input.authRootDir,
        name,
        ...(accountMetadata[name]
          ? { displayMetadata: accountMetadata[name] }
          : {}),
        ...(input.stateRootDir ? { stateRootDir: input.stateRootDir } : {}),
        ...(input.liveCheck ? { liveCheck: input.liveCheck } : {}),
        ...(input.codexBinaryPath ? { codexBinaryPath: input.codexBinaryPath } : {}),
        ...(input.liveCheckTimeoutMs ? { liveCheckTimeoutMs: input.liveCheckTimeoutMs } : {}),
      }),
    ),
  );
}

async function inspectCodexGoalAccount(input: {
  readonly authRootDir: string;
  readonly name: string;
  readonly displayMetadata?: CodexAccountDisplayMetadata;
  readonly stateRootDir?: string;
  readonly liveCheck?: boolean;
  readonly codexBinaryPath?: string;
  readonly liveCheckTimeoutMs?: number;
}): Promise<CodexGoalAccountSlotStatus> {
  const authJsonPath = join(input.authRootDir, input.name, "auth.json");
  const display = codexAccountDisplayMetadataForSlot(
    input.name,
    input.displayMetadata,
  );
  try {
    const authJsonBytes = await readFile(authJsonPath, "utf8");
    const validation = validateCodexAuthJsonBytes({ authJsonBytes });
    const freshness = readCodexAuthJsonFreshness({ authJsonBytes });
    const identity = sanitizedCodexIdentity(validation.parsed.tokens.id_token);
    const capacity = readAccountCapacity({
      accountName: input.name,
      ...(input.stateRootDir ? { stateRootDir: input.stateRootDir } : {}),
    });
    const live = input.liveCheck
      ? await inspectCodexAccountLiveStatus({
          codexHome: dirname(authJsonPath),
          ...(input.codexBinaryPath ? { codexBinaryPath: input.codexBinaryPath } : {}),
          ...(input.liveCheckTimeoutMs ? { timeoutMs: input.liveCheckTimeoutMs } : {}),
        })
      : undefined;
    const warnings = [...validation.warnings, ...freshness.warnings];
    if (live && !live.ok) {
      const availability = codexGoalAccountAvailability({
        status: "auth_invalid",
        capacity,
      });
      return {
        name: input.name,
        ...display,
        authJsonPath,
        status: "auth_invalid",
        ...availability,
        byteLength: validation.byteLength,
        authJsonSha256Prefix: validation.exactBytesSha256.slice(0, 12),
        ...(identity ? { identitySource: identity.source } : {}),
        ...(identity ? { identityHashPrefix: identity.hashPrefix } : {}),
        ...(freshness.lastRefreshAt
          ? { lastRefreshAt: freshness.lastRefreshAt.toISOString() }
          : {}),
        ...(freshness.expiresAt
          ? { expiresAt: freshness.expiresAt.toISOString() }
          : {}),
        ...(capacity?.availability
          ? { capacityAvailability: capacity.availability }
          : {}),
        ...(capacity?.reason ? { capacityReason: capacity.reason } : {}),
        ...(capacity?.cooldownUntil
          ? { capacityCooldownUntil: capacity.cooldownUntil.toISOString() }
          : {}),
        ...(capacity?.lastLimitSignalAt
          ? { capacityLastLimitSignalAt: capacity.lastLimitSignalAt.toISOString() }
          : {}),
        liveCheck: "failed",
        liveCheckSafeMessage: live.safeMessage,
        warnings,
        safeMessage: live.safeMessage,
      };
    }
    const availability = codexGoalAccountAvailability({
      status: "ready",
      capacity,
    });
    return {
      name: input.name,
      ...display,
      authJsonPath,
      status: "ready",
      ...availability,
      byteLength: validation.byteLength,
      authJsonSha256Prefix: validation.exactBytesSha256.slice(0, 12),
      ...(identity ? { identitySource: identity.source } : {}),
      ...(identity ? { identityHashPrefix: identity.hashPrefix } : {}),
      ...(freshness.lastRefreshAt
        ? { lastRefreshAt: freshness.lastRefreshAt.toISOString() }
        : {}),
      ...(freshness.expiresAt
        ? { expiresAt: freshness.expiresAt.toISOString() }
        : {}),
      ...(capacity?.availability
        ? { capacityAvailability: capacity.availability }
        : {}),
      ...(capacity?.reason ? { capacityReason: capacity.reason } : {}),
      ...(capacity?.cooldownUntil
        ? { capacityCooldownUntil: capacity.cooldownUntil.toISOString() }
        : {}),
      ...(capacity?.lastLimitSignalAt
        ? { capacityLastLimitSignalAt: capacity.lastLimitSignalAt.toISOString() }
        : {}),
      ...(live ? { liveCheck: "passed" as const } : {}),
      ...(live ? { liveCheckSafeMessage: live.safeMessage } : {}),
      warnings,
      safeMessage: warnings.length
        ? "auth.json is readable but has warnings"
        : "auth.json is readable",
    };
  } catch (error) {
    const safeMessage = error instanceof Error ? error.message : "auth_invalid";
    return {
      name: input.name,
      ...display,
      authJsonPath,
      status: safeMessage.includes("ENOENT") ? "auth_missing" : "auth_invalid",
      ...codexGoalAccountAvailability({
        status: safeMessage.includes("ENOENT") ? "auth_missing" : "auth_invalid",
        capacity: null,
      }),
      warnings: [],
      safeMessage: safeMessage.includes("ENOENT")
        ? "auth.json is missing"
        : safeMessage,
    };
  }
}

function codexGoalAccountAvailability(input: {
  readonly status: CodexGoalAccountStatus;
  readonly capacity: WorkerCapacitySnapshot | null;
}): {
  readonly availability: ProviderAccountAvailability;
  readonly schedulerEligible: boolean;
  readonly recommendedAction: ProviderAccountAction;
  readonly limitResetAt?: string;
} {
  if (input.status !== "ready") {
    const availability = "reconnect_required";
    return {
      availability,
      schedulerEligible: isSchedulerEligible(availability),
      recommendedAction: recommendedActionForAvailability(availability),
    };
  }

  const capacitySignal = input.capacity
    ? workerCapacityToDiagnosticSignal(input.capacity)
    : null;
  const availability = capacitySignal?.availability ?? "available";
  return {
    availability,
    schedulerEligible: isSchedulerEligible(availability),
    recommendedAction: recommendedActionForAvailability(availability),
    ...(capacitySignal?.limitResetAt
      ? { limitResetAt: capacitySignal.limitResetAt.toISOString() }
      : {}),
  };
}

async function inspectCodexAccountLiveStatus(input: {
  readonly codexHome: string;
  readonly codexBinaryPath?: string;
  readonly timeoutMs?: number;
}): Promise<{ readonly ok: boolean; readonly safeMessage: string }> {
  const codexBinaryPath = input.codexBinaryPath ?? "codex";
  try {
    await execFileAsync(codexBinaryPath, ["login", "status"], {
      env: {
        ...process.env,
        CODEX_HOME: input.codexHome,
      },
      timeout: input.timeoutMs ?? 70_000,
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, safeMessage: "codex login status passed" };
  } catch (error) {
    if (isExecTimeoutError(error)) {
      return { ok: false, safeMessage: "codex login status timed out" };
    }
    return { ok: false, safeMessage: "codex login status failed" };
  }
}

function isExecTimeoutError(error: unknown): boolean {
  return isRecord(error) &&
    (error.signal === "SIGTERM" || error.killed === true || error.code === "ETIMEDOUT");
}

function sanitizedCodexIdentity(idToken: string | undefined): {
  readonly source: string;
  readonly hashPrefix: string;
} | null {
  if (!idToken) return null;
  const claims = decodeJwtClaims(idToken);
  if (!claims) return null;
  const authClaims = isRecord(claims["https://api.openai.com/auth"])
    ? claims["https://api.openai.com/auth"]
    : {};
  const candidates = [
    ["chatgpt_account_id", authClaims.chatgpt_account_id],
    ["chatgpt_user_id", authClaims.chatgpt_user_id],
    ["sub", claims.sub],
    ["email", claims.email],
  ] as const;
  for (const [source, value] of candidates) {
    if (typeof value !== "string" || !value.trim()) continue;
    return {
      source,
      hashPrefix: hashText(source + ":" + value).slice(0, 16),
    };
  }
  return null;
}

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const parsed: unknown = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readAccountCapacity(input: {
  readonly stateRootDir?: string;
  readonly accountName: string;
}) {
  if (!input.stateRootDir) return null;
  try {
    return new LocalFileWorkerAccountCapacityStore({
      rootDir: join(input.stateRootDir, "worker-account-capacity"),
    }).read({ accountId: input.accountName });
  } catch {
    return null;
  }
}

async function listAccountDirectories(authRootDir: string): Promise<readonly string[]> {
  try {
    const entries = await readdir(authRootDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
