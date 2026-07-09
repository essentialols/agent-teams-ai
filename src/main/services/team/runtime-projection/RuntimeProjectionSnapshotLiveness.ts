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
  const confirmedOpenCodeRuntimeAdapterAlive = input.confirmedOpenCodeRuntimeAdapterAlive === true;
  const confirmedOpenCodeBootstrapAlive =
    confirmedOpenCodeRuntimeAlive || confirmedOpenCodeRuntimeAdapterAlive;
  const confirmedSpawnRuntimeFallback = input.confirmedSpawnRuntimeFallback === true;
  const strongLiveOpenCodeEvidence =
    input.liveLivenessKind === 'runtime_process' || input.liveLivenessKind === 'confirmed_bootstrap';
  const openCodeBootstrapConfirmed =
    confirmedOpenCodeBootstrapAlive && !strongLiveOpenCodeEvidence;
  const spawnRuntimeDiagnostic = nonEmptyString(input.spawnRuntimeDiagnostic);
  const liveRuntimeDiagnostic = nonEmptyString(input.liveRuntimeDiagnostic);

  const alive =
    input.liveAlive === true || confirmedOpenCodeBootstrapAlive || confirmedSpawnRuntimeFallback;
  const livenessKind = openCodeBootstrapConfirmed
    ? 'confirmed_bootstrap'
    : confirmedSpawnRuntimeFallback
      ? 'confirmed_bootstrap'
      : input.liveLivenessKind;
  const pidSource =
    (openCodeBootstrapConfirmed || confirmedSpawnRuntimeFallback) &&
    (input.livePidSource === 'persisted_metadata' || input.livePidSource == null)
      ? 'runtime_bootstrap'
      : input.livePidSource;
  const runtimeDiagnostic = openCodeBootstrapConfirmed
    ? 'OpenCode bootstrap confirmed; runtime host/session evidence present.'
    : confirmedSpawnRuntimeFallback
      ? input.keepConfirmedSpawnRuntimeDiagnostic === true && spawnRuntimeDiagnostic
        ? spawnRuntimeDiagnostic
        : 'bootstrap confirmed'
      : liveRuntimeDiagnostic;
  const runtimeDiagnosticSeverity = openCodeBootstrapConfirmed
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
