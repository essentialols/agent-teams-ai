import type { WorkerControlContinuationBatch } from "../../control";
import type { AttemptFailureReason } from "../domain/safe-execution-policy";
import type {
  ContinuationPacket,
  TaskRunId,
  WorkspaceSnapshot,
} from "../domain/safe-execution-task";
import type { ContinuationPacketBuilder } from "../ports/safe-execution-ports";

export class DefaultContinuationPacketBuilder
  implements ContinuationPacketBuilder
{
  build(input: {
    readonly taskId: TaskRunId;
    readonly attemptNumber: number;
    readonly provider: string;
    readonly workspacePath: string;
    readonly originalPrompt: string;
    readonly previousFailureReason: AttemptFailureReason;
    readonly snapshot: WorkspaceSnapshot;
    readonly previousOutputSummary?: string;
    readonly controlBatch?: WorkerControlContinuationBatch;
  }): ContinuationPacket {
    const changedFiles = input.snapshot.changedFiles;
    const filesText =
      changedFiles.length === 0
        ? "No changed files were detected."
        : changedFiles.slice(0, 80).map((file) => `- ${file}`).join("\n");
    const previousOutputText = input.previousOutputSummary
      ? `\nPrevious output summary:\n${input.previousOutputSummary}\n`
      : "";
    const diffStatText = input.snapshot.diffStat
      ? `\nDiff stat:\n${input.snapshot.diffStat}\n`
      : "";
    const controlText = input.controlBatch?.message
      ? `\n${input.controlBatch.message}\n`
      : "";
    const message = [
      "Continue the same task in the current workspace.",
      "",
      `Task id: ${input.taskId}`,
      `Attempt: ${input.attemptNumber}`,
      `Provider: ${input.provider}`,
      `Workspace: ${input.workspacePath}`,
      `Previous attempt stopped because: ${input.previousFailureReason}`,
      "",
      "Original task:",
      input.originalPrompt,
      previousOutputText.trimEnd(),
      "",
      "Current workspace summary:",
      input.snapshot.summary,
      diffStatText.trimEnd(),
      controlText.trimEnd(),
      "",
      "Changed files:",
      filesText,
      "",
      "Important instruction:",
      "Do not restart from scratch. Inspect the current workspace state and continue from the existing partial changes.",
    ]
      .filter((line) => line !== "")
      .join("\n");

    return {
      taskId: input.taskId,
      attemptNumber: input.attemptNumber,
      provider: input.provider,
      workspacePath: input.workspacePath,
      originalPrompt: input.originalPrompt,
      previousFailureReason: input.previousFailureReason,
      changedFiles,
      workspaceSummary: input.snapshot.summary,
      ...(input.previousOutputSummary === undefined
        ? {}
        : { previousOutputSummary: input.previousOutputSummary }),
      ...(input.controlBatch?.signalIds.length
        ? { workerControlSignalIds: input.controlBatch.signalIds }
        : {}),
      message,
    };
  }
}
