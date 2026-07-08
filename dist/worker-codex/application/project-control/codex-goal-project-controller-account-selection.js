import { availableCodexGoalAccountSlots, dedupeCodexGoalAccountSlots, } from "../codex-goal-accounts.js";
export function selectProjectControllerCodexAccountSlot(input) {
    const allowedAccountIds = input.allowedAccountIds === undefined
        ? undefined
        : new Set(input.allowedAccountIds);
    return availableCodexGoalAccountSlots(dedupeCodexGoalAccountSlots(input.slots))
        .find((slot) => allowedAccountIds === undefined ||
        allowedAccountIds.has(slot.name));
}
//# sourceMappingURL=codex-goal-project-controller-account-selection.js.map