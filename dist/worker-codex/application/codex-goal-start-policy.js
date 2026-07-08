export function isSafeStartAction(action) {
    return action === "start_worker" ||
        action === "continue_after_capacity" ||
        action === "continue_after_timeout" ||
        action === "continue_after_provider_output";
}
//# sourceMappingURL=codex-goal-start-policy.js.map