import type { WorkerHealthSnapshot } from "../../worker-health";
import type { BaseRevisionStatus } from "../../base-revision";

export type WorkerBaseStatus = BaseRevisionStatus;

export type WorkerStatusView = {
  readonly model?: string;
  readonly effort?: string;
  readonly serviceTier?: string;
  readonly account?: string;
  readonly runtimeVersion?: string;
  readonly runtimeBuild?: string;
  readonly accessBoundary?: string;
  readonly baseCommit?: string;
  readonly targetCommit?: string;
  readonly baseStatus?: WorkerBaseStatus;
  readonly freshAgeMs?: number;
  readonly staleAfterMs?: number;
  readonly handoffStatus?: string;
  readonly dirtyFilesCount?: number;
  readonly activeWriterRisk: WorkerHealthSnapshot["activeWriterRisk"]["kind"];
  readonly safeToContinue: boolean;
  readonly nextBestActionHint?: string;
};

export type WorkerStatusViewInput = {
  readonly model?: string;
  readonly effort?: string;
  readonly serviceTier?: string;
  readonly account?: string;
  readonly runtimeVersion?: string;
  readonly runtimeBuild?: string;
  readonly accessBoundary?: string;
  readonly baseCommit?: string;
  readonly targetCommit?: string;
  readonly baseStatus?: WorkerBaseStatus;
  readonly freshAgeMs?: number;
  readonly staleAfterMs?: number;
  readonly handoffStatus?: string;
  readonly dirtyFilesCount?: number;
  readonly health: WorkerHealthSnapshot;
  readonly nextBestActionHint?: string;
};
