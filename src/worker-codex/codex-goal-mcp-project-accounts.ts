import { listCodexGoalAccountStatuses } from "./codex-goal-ops";
import { uniqueProjectControlStrings } from "./codex-goal-mcp-project-utils";

export async function projectControlDefaultAccountNames(input: {
  readonly authRootDir?: string;
  readonly requestedAccounts: readonly string[];
  readonly allowedAccountIds: readonly string[];
}): Promise<readonly string[]> {
  if (!input.authRootDir) return input.requestedAccounts;
  const allowed = new Set(input.allowedAccountIds);
  const slots = await listCodexGoalAccountStatuses({
    authRootDir: input.authRootDir,
  });
  const readyAccounts = slots
    .filter((slot) =>
      slot.status === "ready" &&
      (allowed.size === 0 || allowed.has(slot.name))
    )
    .map((slot) => slot.name);
  return readyAccounts.length > 0 ? readyAccounts : input.requestedAccounts;
}

export async function projectControlRefillAccountNames(input: {
  readonly authRootDir?: string;
  readonly requestedAccounts: readonly string[];
  readonly allowedAccountIds: readonly string[];
  readonly rotationKey?: string;
}): Promise<readonly string[]> {
  const requestedAccounts = input.requestedAccounts.length
    ? uniqueProjectControlStrings(input.requestedAccounts)
    : await projectControlDefaultAccountNames(input);
  const allowed = new Set(input.allowedAccountIds);
  const scopedAccounts = requestedAccounts.filter((account) =>
    allowed.size === 0 || allowed.has(account)
  );
  if (!input.authRootDir || scopedAccounts.length === 0) {
    return rotateProjectControlAccountNames(scopedAccounts, input.rotationKey);
  }

  const slots = await listCodexGoalAccountStatuses({
    authRootDir: input.authRootDir,
    accounts: scopedAccounts,
  });
  const ready = new Set(
    slots
      .filter((slot) => slot.status === "ready")
      .map((slot) => slot.name),
  );
  const readyAccounts = ready.size > 0
    ? scopedAccounts.filter((account) => ready.has(account))
    : scopedAccounts;
  return rotateProjectControlAccountNames(readyAccounts, input.rotationKey);
}

export function rotateProjectControlAccountNames(
  accounts: readonly string[],
  rotationKey?: string,
): readonly string[] {
  if (accounts.length < 2 || !rotationKey?.trim()) return [...accounts];
  const offset = stableRotationOffset(rotationKey, accounts.length);
  return [...accounts.slice(offset), ...accounts.slice(0, offset)];
}

function stableRotationOffset(rotationKey: string, accountCount: number): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < rotationKey.length; index += 1) {
    hash ^= rotationKey.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % accountCount;
}
