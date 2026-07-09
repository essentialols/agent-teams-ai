import { readUsageFromRecords, usageField } from "../domain/app-server-usage";
import type {
  CodexThreadGoal,
  CodexThreadGoalStatus,
} from "../domain/app-server-types";
import { readRecord, stringField } from "./app-server-content-parser";

export type {
  CodexThreadGoal,
  CodexThreadGoalStatus,
} from "../domain/app-server-types";

export function readGoal(value: unknown): CodexThreadGoal | null {
  const goal = readRecord(value);
  if (!goal) return null;
  const threadId = stringField(goal, "threadId");
  const objective = stringField(goal, "objective");
  const status = stringField(goal, "status");
  if (!threadId || !objective || !isGoalStatus(status)) return null;
  return {
    threadId,
    objective,
    status,
    ...usageField(readUsageFromRecords(goal)),
  };
}

export function isGoalStatus(
  value: string | null,
): value is CodexThreadGoalStatus {
  return (
    value === "active" ||
    value === "paused" ||
    value === "blocked" ||
    value === "usageLimited" ||
    value === "budgetLimited" ||
    value === "complete"
  );
}
