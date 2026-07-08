import { SafeExecutionError } from "../domain/safe-execution-policy";
import type {
  SafeExecutionTaskRecord,
  TaskRunId,
} from "../domain/safe-execution-task";

export function requireTaskRecord(
  record: SafeExecutionTaskRecord | null | undefined,
  taskId: TaskRunId,
): SafeExecutionTaskRecord {
  if (record) return record;
  throw new SafeExecutionError(
    "safe_execution_invalid_task",
    "Safe execution task record is missing.",
    { details: { taskId } },
  );
}
