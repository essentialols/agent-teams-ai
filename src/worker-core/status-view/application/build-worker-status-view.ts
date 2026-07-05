import type {
  WorkerStatusView,
  WorkerStatusViewInput,
} from "../domain/status-view";

export class BuildWorkerStatusViewUseCase {
  build(input: WorkerStatusViewInput): WorkerStatusView {
    return {
      ...(input.model === undefined ? {} : { model: input.model }),
      ...(input.effort === undefined ? {} : { effort: input.effort }),
      ...(input.serviceTier === undefined ? {} : { serviceTier: input.serviceTier }),
      ...(input.account === undefined ? {} : { account: input.account }),
      ...(input.runtimeVersion === undefined
        ? {}
        : { runtimeVersion: input.runtimeVersion }),
      ...(input.runtimeBuild === undefined ? {} : { runtimeBuild: input.runtimeBuild }),
      ...(input.accessBoundary === undefined
        ? {}
        : { accessBoundary: input.accessBoundary }),
      ...(input.baseCommit === undefined ? {} : { baseCommit: input.baseCommit }),
      ...(input.targetCommit === undefined ? {} : { targetCommit: input.targetCommit }),
      ...(input.baseStatus === undefined ? {} : { baseStatus: input.baseStatus }),
      ...(input.freshAgeMs === undefined ? {} : { freshAgeMs: input.freshAgeMs }),
      ...(input.staleAfterMs === undefined ? {} : { staleAfterMs: input.staleAfterMs }),
      ...(input.handoffStatus === undefined
        ? {}
        : { handoffStatus: input.handoffStatus }),
      ...(input.dirtyFilesCount === undefined
        ? {}
        : { dirtyFilesCount: input.dirtyFilesCount }),
      activeWriterRisk: input.health.activeWriterRisk.kind,
      safeToContinue: input.health.safeToContinue,
      ...(input.nextBestActionHint === undefined
        ? {}
        : { nextBestActionHint: input.nextBestActionHint }),
    };
  }
}

export function buildWorkerStatusView(
  input: WorkerStatusViewInput,
): WorkerStatusView {
  return new BuildWorkerStatusViewUseCase().build(input);
}
