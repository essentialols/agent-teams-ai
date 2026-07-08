import { redactText, truncateText } from "../codex-goal-decision";

export type ProjectControllerGuidanceSignal = {
  readonly signal: {
    readonly createdAt: Date;
    readonly createdBy: string;
    readonly priority: string;
    readonly body: string;
  };
};

export function projectControllerPendingGuidancePromptContext(input: {
  readonly pendingCount: number;
  readonly deliverableSignals: readonly ProjectControllerGuidanceSignal[];
}): string | undefined {
  const deliverable = input.deliverableSignals
    .slice()
    .sort((left, right) =>
      right.signal.createdAt.getTime() - left.signal.createdAt.getTime()
    )
    .slice(0, 5);
  if (deliverable.length === 0) return undefined;

  const lines = [
    "Pending controller guidance from durable inbox:",
    "- Treat this as read-only context for this run.",
    "- Before applying it, call codex_goal_project_controller_consume_guidance for your controller job so the inbox records delivery.",
    "- pendingCount=" + input.pendingCount +
      " deliverableCount=" + input.deliverableSignals.length,
  ];
  for (const view of deliverable) {
    const signal = view.signal;
    lines.push(
      "- " + signal.createdAt.toISOString() + " " +
        signal.createdBy + "/" + signal.priority + ": " +
        truncateText(redactPromptGuidanceText(signal.body), 800),
    );
  }
  if (input.deliverableSignals.length > deliverable.length) {
    lines.push(
      "- " + (input.deliverableSignals.length - deliverable.length) +
        " older deliverable guidance item(s) omitted from prompt context.",
    );
  }
  return lines.join("\n");
}

function redactPromptGuidanceText(value: string): string {
  return redactText(value).replace(/[A-Za-z0-9_=-]{32,}/g, "[redacted]");
}
