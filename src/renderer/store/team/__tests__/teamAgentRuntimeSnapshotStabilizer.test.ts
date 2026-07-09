import { describe, expect, it } from 'vitest';

import { areTeamAgentRuntimeSnapshotsEqual } from '../teamAgentRuntimeSnapshotEquality';
import { stabilizeTeamAgentRuntimeSnapshot } from '../teamAgentRuntimeSnapshotStabilizer';

import type { TeamAgentRuntimeEntry, TeamAgentRuntimeSnapshot } from '@shared/types';

function makeEntry(
  input: Partial<TeamAgentRuntimeEntry> & { updatedAt: string }
): TeamAgentRuntimeEntry {
  return {
    memberName: 'alice',
    alive: true,
    restartable: true,
    backendType: 'process',
    livenessKind: 'runtime_process',
    ...input,
    updatedAt: input.updatedAt,
  };
}

function makeSnapshot(updatedAt: string, entry: TeamAgentRuntimeEntry): TeamAgentRuntimeSnapshot {
  return {
    teamName: 'alpha',
    runId: 'run-1',
    updatedAt,
    members: { alice: entry },
  };
}

describe('team agent runtime snapshot stabilization', () => {
  it('treats timestamp-only live observations as fresh before transient offline stabilization', () => {
    const firstLive = makeSnapshot(
      '2026-01-01T00:00:00.000Z',
      makeEntry({ updatedAt: '2026-01-01T00:00:00.000Z' })
    );
    const refreshedLive = makeSnapshot(
      '2026-01-01T00:00:20.000Z',
      makeEntry({ updatedAt: '2026-01-01T00:00:20.000Z' })
    );

    expect(areTeamAgentRuntimeSnapshotsEqual(firstLive, refreshedLive)).toBe(false);

    const transientOffline = makeSnapshot(
      '2026-01-01T00:00:25.000Z',
      makeEntry({
        alive: false,
        livenessKind: 'registered_only',
        runtimeDiagnosticSeverity: 'warning',
        updatedAt: '2026-01-01T00:00:25.000Z',
      })
    );

    const stabilized = stabilizeTeamAgentRuntimeSnapshot(
      refreshedLive,
      transientOffline,
      Date.parse('2026-01-01T00:00:25.000Z')
    );

    expect(stabilized.members.alice?.alive).toBe(true);
    expect(stabilized.members.alice?.updatedAt).toBe('2026-01-01T00:00:20.000Z');
  });
});
