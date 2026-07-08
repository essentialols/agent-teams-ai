import type {
  TeamAgentRuntimeDiagnosticSeverity,
  TeamAgentRuntimeLivenessKind,
  TeamAgentRuntimePidSource,
} from '@shared/types';

export interface RuntimeProjectionSnapshotMemberLivenessInput {
  liveAlive?: boolean;
  liveLivenessKind?: TeamAgentRuntimeLivenessKind;
  livePidSource?: TeamAgentRuntimePidSource;
  liveRuntimeDiagnostic?: string;
  liveRuntimeDiagnosticSeverity?: TeamAgentRuntimeDiagnosticSeverity;
  spawnRuntimeDiagnostic?: string;
  spawnRuntimeDiagnosticSeverity?: TeamAgentRuntimeDiagnosticSeverity;
  confirmedOpenCodeRuntimeAlive?: boolean;
  confirmedOpenCodeRuntimeAdapterAlive?: boolean;
  confirmedSpawnRuntimeFallback?: boolean;
  keepConfirmedSpawnRuntimeDiagnostic?: boolean;
}

export interface RuntimeProjectionSnapshotMemberLivenessFields {
  alive: boolean;
  livenessKind?: TeamAgentRuntimeLivenessKind;
  pidSource?: TeamAgentRuntimePidSource;
  runtimeDiagnostic?: string;
  runtimeDiagnosticSeverity?: TeamAgentRuntimeDiagnosticSeverity;
}

function nonEmptyString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function projectRuntimeSnapshotMemberLivenessFields(
  input: RuntimeProjectionSnapshotMemberLivenessInput
): RuntimeProjectionSnapshotMemberLivenessFields {
  const confirmedOpenCodeRuntimeAlive = input.confirmedOpenCodeRuntimeAlive === true;
  const confirmedSpawnRuntimeFallback = input.confirmedSpawnRuntimeFallback === true;
  const openCodeCandidateConfirmed =
    confirmedOpenCodeRuntimeAlive && input.liveLivenessKind === 'runtime_process_candidate';
  const spawnRuntimeDiagnostic = nonEmptyString(input.spawnRuntimeDiagnostic);
  const liveRuntimeDiagnostic = nonEmptyString(input.liveRuntimeDiagnostic);

  const alive =
    input.liveAlive === true ||
    confirmedOpenCodeRuntimeAlive ||
    input.confirmedOpenCodeRuntimeAdapterAlive === true ||
    confirmedSpawnRuntimeFallback;
  const livenessKind = openCodeCandidateConfirmed
    ? 'confirmed_bootstrap'
    : confirmedSpawnRuntimeFallback
      ? 'confirmed_bootstrap'
      : input.liveLivenessKind;
  const pidSource =
    confirmedSpawnRuntimeFallback &&
    (input.livePidSource === 'persisted_metadata' || input.livePidSource == null)
      ? 'runtime_bootstrap'
      : input.livePidSource;
  const runtimeDiagnostic = openCodeCandidateConfirmed
    ? 'OpenCode bootstrap confirmed; runtime host/session evidence present.'
    : confirmedSpawnRuntimeFallback
      ? input.keepConfirmedSpawnRuntimeDiagnostic === true && spawnRuntimeDiagnostic
        ? spawnRuntimeDiagnostic
        : 'bootstrap confirmed'
      : liveRuntimeDiagnostic;
  const runtimeDiagnosticSeverity = openCodeCandidateConfirmed
    ? 'info'
    : confirmedSpawnRuntimeFallback
      ? input.keepConfirmedSpawnRuntimeDiagnostic === true
        ? (input.spawnRuntimeDiagnosticSeverity ?? input.liveRuntimeDiagnosticSeverity ?? 'info')
        : 'info'
      : input.liveRuntimeDiagnosticSeverity;

  return {
    alive,
    ...(livenessKind ? { livenessKind } : {}),
    ...(pidSource ? { pidSource } : {}),
    ...(runtimeDiagnostic ? { runtimeDiagnostic } : {}),
    ...(runtimeDiagnosticSeverity ? { runtimeDiagnosticSeverity } : {}),
  };
}
