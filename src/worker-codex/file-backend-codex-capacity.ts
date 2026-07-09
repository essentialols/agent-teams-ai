import type { WorkerCapacitySnapshot } from "@vioxen/subscription-runtime/worker-core";
import type { CodexWorkerCapacityPolicy } from "./file-backend-codex-worker";

export function capacityWindowMs(policy: CodexWorkerCapacityPolicy | undefined): number {
  return policy?.windowMs ?? 5 * 60 * 60 * 1000;
}

export function normalizeResettableCapacity(
  capacity: WorkerCapacitySnapshot,
  now: Date,
): WorkerCapacitySnapshot {
  if (
    !isResettableCapacity(capacity) ||
    !capacity.cooldownUntil ||
    capacity.cooldownUntil.getTime() > now.getTime()
  ) {
    return capacity;
  }

  const {
    cooldownUntil: _cooldownUntil,
    lastLimitSignalAt: _lastLimitSignalAt,
    reason: _reason,
    ...rest
  } = capacity;
  return {
    ...rest,
    availability: "available",
  };
}

export function isAuthReseedableCapacity(capacity: WorkerCapacitySnapshot): boolean {
  return (
    capacity.availability !== "available" &&
    (
      capacity.reason === "auth_invalid" ||
      capacity.reason === "provider_session_invalid" ||
      capacity.reason === "reconnect_required" ||
      capacity.reason === "provider_reconnect_required" ||
      capacity.reason === "session_unhealthy" ||
      capacity.reason === "quota_limited" ||
      capacity.availability === "cooldown" ||
      capacity.availability === "quota_exhausted" ||
      capacity.availability === "disabled"
    )
  );
}

function isResettableCapacity(capacity: WorkerCapacitySnapshot): boolean {
  return (
    capacity.availability === "cooldown" ||
    capacity.availability === "quota_exhausted"
  );
}

export function isSevereCapacity(capacity: WorkerCapacitySnapshot): boolean {
  return (
    capacity.availability === "quota_exhausted" ||
    capacity.availability === "degraded" ||
    capacity.availability === "disabled"
  );
}

export function normalizeCapacityAccountId(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
