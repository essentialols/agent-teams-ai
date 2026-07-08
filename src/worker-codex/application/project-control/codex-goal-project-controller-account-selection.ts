import {
  availableCodexGoalAccountSlots,
  dedupeCodexGoalAccountSlots,
  type CodexGoalAccountSlot,
} from "../codex-goal-accounts";

export function selectProjectControllerCodexAccountSlot(input: {
  readonly slots: readonly CodexGoalAccountSlot[];
  readonly allowedAccountIds?: readonly string[] | undefined;
}): CodexGoalAccountSlot | undefined {
  const allowedAccountIds = input.allowedAccountIds === undefined
    ? undefined
    : new Set(input.allowedAccountIds);
  return availableCodexGoalAccountSlots(dedupeCodexGoalAccountSlots(input.slots))
    .find((slot) =>
      allowedAccountIds === undefined ||
      allowedAccountIds.has(slot.name)
    );
}
