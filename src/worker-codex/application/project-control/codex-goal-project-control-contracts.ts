import type {
  ProjectAdmissionWorkerRole,
  ProjectControlOperationResult,
} from "@vioxen/subscription-runtime/worker-core";

export type CodexGoalProjectCreateWorktreeInput = {
  readonly sourceWorkspacePath: string;
  readonly realSourceWorkspacePath?: string;
  readonly path: string;
  readonly baseBranch?: string;
  readonly sourceRef?: string;
  readonly newBranch?: string;
  readonly workerRole?: ProjectAdmissionWorkerRole | `${ProjectAdmissionWorkerRole}`;
  readonly tags?: readonly string[];
};

export function noopOperationResult(
  resourceId: string,
  safeMessage: string,
): ProjectControlOperationResult {
  return {
    status: "noop",
    resourceId,
    safeMessage,
  };
}
