import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  AttemptFailureReason,
  TaskEffectMode,
} from "../domain/safe-execution-policy";
import type {
  AttemptRecord,
  SafeExecutionTaskRecord,
  SafeExecutionTaskStatus,
  TaskRunId,
  WorkspaceRunId,
} from "../domain/safe-execution-task";
import type { AttemptJournal } from "../ports/safe-execution-ports";
import { hashText } from "../application/safe-execution-workspace";
import { requireTaskRecord } from "../application/safe-execution-task-records";
import { atomicWriteJson } from "./file-json";
import {
  parseTaskRecord,
  serializeTaskRecord,
} from "./safe-execution-record-codec";
import { isNodeErrorCode } from "./workspace-locking";

export class LocalFileAttemptJournal implements AttemptJournal {
  constructor(private readonly rootDir: string) {}

  async readTask(input: {
    readonly taskId: TaskRunId;
  }): Promise<SafeExecutionTaskRecord | null> {
    try {
      return parseTaskRecord(
        await readFile(this.taskPath(input.taskId), "utf8"),
      );
    } catch (error) {
      if (isNodeErrorCode(error, "ENOENT")) return null;
      throw error;
    }
  }

  async startTask(input: {
    readonly taskId: TaskRunId;
    readonly workspaceRunId: WorkspaceRunId;
    readonly workspacePath: string;
    readonly effectMode: TaskEffectMode;
    readonly provider: string;
    readonly now: Date;
  }): Promise<SafeExecutionTaskRecord> {
    const existing = await this.readTask({ taskId: input.taskId });
    const record: SafeExecutionTaskRecord = existing
      ? {
          ...existing,
          status: existing.status === "completed" ? existing.status : "running",
          updatedAt: input.now,
        }
      : {
          taskId: input.taskId,
          workspaceRunId: input.workspaceRunId,
          workspacePath: input.workspacePath,
          effectMode: input.effectMode,
          provider: input.provider,
          status: "running",
          startedAt: input.now,
          updatedAt: input.now,
          attempts: [],
        };
    await this.writeTask(record);
    return record;
  }

  async appendAttempt(input: {
    readonly taskId: TaskRunId;
    readonly attempt: AttemptRecord;
    readonly now: Date;
  }): Promise<SafeExecutionTaskRecord> {
    const record = requireTaskRecord(
      await this.readTask({ taskId: input.taskId }),
      input.taskId,
    );
    const next: SafeExecutionTaskRecord = {
      ...record,
      status: "running",
      updatedAt: input.now,
      attempts: [...record.attempts, input.attempt],
      ...(input.attempt.failureReason
        ? {
            lastFailureReason: input.attempt.failureReason,
            lastFailureMessage: input.attempt.failureMessage,
            ...(input.attempt.failureDetails === undefined
              ? {}
              : { lastFailureDetails: input.attempt.failureDetails }),
          }
        : {}),
    };
    await this.writeTask(next);
    return next;
  }

  async completeTask(input: {
    readonly taskId: TaskRunId;
    readonly result: unknown;
    readonly outputSummary?: string;
    readonly now: Date;
  }): Promise<SafeExecutionTaskRecord> {
    const record = requireTaskRecord(
      await this.readTask({ taskId: input.taskId }),
      input.taskId,
    );
    const next: SafeExecutionTaskRecord = {
      ...record,
      status: "completed",
      updatedAt: input.now,
      completedAt: input.now,
      result: input.result,
      ...(input.outputSummary === undefined
        ? {}
        : { outputSummary: input.outputSummary }),
    };
    await this.writeTask(next);
    return next;
  }

  async markPartial(input: {
    readonly taskId: TaskRunId;
    readonly status: Exclude<SafeExecutionTaskStatus, "running" | "completed">;
    readonly reason: AttemptFailureReason;
    readonly message?: string;
    readonly details?: Readonly<Record<string, string>>;
    readonly now: Date;
  }): Promise<SafeExecutionTaskRecord> {
    const record = requireTaskRecord(
      await this.readTask({ taskId: input.taskId }),
      input.taskId,
    );
    const next: SafeExecutionTaskRecord = {
      ...record,
      status: input.status,
      updatedAt: input.now,
      lastFailureReason: input.reason,
      ...(input.message === undefined ? {} : { lastFailureMessage: input.message }),
      ...(input.details === undefined ? {} : { lastFailureDetails: input.details }),
    };
    await this.writeTask(next);
    return next;
  }

  private taskPath(taskId: TaskRunId): string {
    return join(this.rootDir, "attempt-journal", `${hashText(taskId)}.json`);
  }

  private async writeTask(record: SafeExecutionTaskRecord): Promise<void> {
    const path = this.taskPath(record.taskId);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await atomicWriteJson(path, serializeTaskRecord(record));
  }
}
