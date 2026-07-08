import { redactText, truncateText } from "../codex-goal-decision.js";
export function projectControllerPendingGuidancePromptContext(input) {
    const deliverable = input.deliverableSignals
        .slice()
        .sort((left, right) => right.signal.createdAt.getTime() - left.signal.createdAt.getTime())
        .slice(0, 5);
    if (deliverable.length === 0)
        return undefined;
    const lines = [
        "Pending controller guidance from durable inbox:",
        "- Treat this as read-only context for this run.",
        "- Before applying it, call codex_goal_project_controller_consume_guidance for your controller job so the inbox records delivery.",
        "- pendingCount=" + input.pendingCount +
            " deliverableCount=" + input.deliverableSignals.length,
    ];
    for (const view of deliverable) {
        const signal = view.signal;
        lines.push("- " + signal.createdAt.toISOString() + " " +
            signal.createdBy + "/" + signal.priority + ": " +
            truncateText(redactPromptGuidanceText(signal.body), 800));
    }
    if (input.deliverableSignals.length > deliverable.length) {
        lines.push("- " + (input.deliverableSignals.length - deliverable.length) +
            " older deliverable guidance item(s) omitted from prompt context.");
    }
    return lines.join("\n");
}
function redactPromptGuidanceText(value) {
    return redactText(value).replace(/[A-Za-z0-9_=-]{32,}/g, "[redacted]");
}
//# sourceMappingURL=codex-goal-project-controller-guidance.js.map