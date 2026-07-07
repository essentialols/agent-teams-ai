import { MEMBER_WORK_SYNC_STORE_ID } from '@features/internal-storage/contracts/internalStorageContracts';
import { archiveFileWithGenerations } from '@features/internal-storage/main';

import { areSnapshotRecordSetsEquivalent, snapshotToRecords } from './memberWorkSyncSqliteMappers';

import type { JsonMemberWorkSyncStore } from './JsonMemberWorkSyncStore';
import type { MemberWorkSyncStorageGateway } from '@features/internal-storage/main';

export interface MemberWorkSyncSqliteImporterDeps {
  gateway: MemberWorkSyncStorageGateway;
  /** Owns all legacy file-format knowledge (v1, v2 per-member, indexes). */
  jsonStore: Pick<JsonMemberWorkSyncStore, 'readSnapshotForImport'>;
  logger?: { warn(message: string, metadata?: Record<string, unknown>): void };
}

/**
 * One-time, idempotent JSON -> SQLite import for a team's member-work-sync
 * state. This is message-delivery state, so the sequence is strict:
 *
 *   1. read the full legacy snapshot (absent -> done)
 *   2. replace every team row in one transaction
 *   3. read back and verify the complete content
 *   4. only then archive the legacy files (*.pre-sqlite, never deleted)
 *
 * File presence is the trigger: a crash before archiving or a downgrade that
 * recreated the files leads to a safe re-import where the JSON wins.
 */
const IMPORT_FAILURE_RETRY_COOLDOWN_MS = 60_000;

export class MemberWorkSyncSqliteImporter {
  private readonly importedTeams = new Set<string>();
  private readonly recentFailures = new Map<string, { atMs: number; error: Error }>();

  constructor(private readonly deps: MemberWorkSyncSqliteImporterDeps) {}

  /** Must run under the same per-team mutex as the store methods. */
  async ensureImported(teamName: string): Promise<void> {
    if (this.importedTeams.has(teamName)) {
      return;
    }
    // A failed import stays failed for a cooldown window instead of re-running
    // the full replace transaction on every store call (claimDue polls every
    // few seconds); the JSON files remain the source of truth throughout.
    const failure = this.recentFailures.get(teamName);
    if (failure && Date.now() - failure.atMs < IMPORT_FAILURE_RETRY_COOLDOWN_MS) {
      throw failure.error;
    }
    try {
      await this.importTeamOnce(teamName);
      this.recentFailures.delete(teamName);
    } catch (error) {
      this.recentFailures.set(teamName, {
        atMs: Date.now(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  private async importTeamOnce(teamName: string): Promise<void> {
    const snapshot = await this.deps.jsonStore.readSnapshotForImport(teamName);
    if (snapshot === null) {
      this.importedTeams.add(teamName);
      return;
    }

    // Canonicalize the routing column to the import argument: legacy entries
    // may carry a differently-cased teamName, and rows keyed by it would be
    // invisible to queries (and to the verification read-back below).
    const mapped = snapshotToRecords(snapshot);
    const records = {
      statuses: mapped.statuses.map((record) => ({ ...record, teamName })),
      reportIntents: mapped.reportIntents.map((record) => ({ ...record, teamName })),
      outboxItems: mapped.outboxItems.map((record) => ({ ...record, teamName })),
      metricEvents: mapped.metricEvents.map((record) => ({ ...record, teamName })),
    };
    await this.deps.gateway.importTeam(teamName, records);

    const roundTrip = await this.deps.gateway.listTeamSnapshot(teamName);
    if (!areSnapshotRecordSetsEquivalent(roundTrip, records)) {
      throw new Error(
        `member-work-sync import verification failed for team "${teamName}"; ` +
          'keeping the JSON files as the source of truth'
      );
    }

    await this.deps.gateway.recordStoreImport(
      MEMBER_WORK_SYNC_STORE_ID,
      teamName,
      records.statuses.length + records.reportIntents.length + records.outboxItems.length
    );
    for (const filePath of snapshot.filesToArchive) {
      await archiveFileWithGenerations(filePath);
    }
    this.deps.logger?.warn('member-work-sync legacy JSON imported into sqlite', {
      teamName,
      statuses: records.statuses.length,
      reportIntents: records.reportIntents.length,
      outboxItems: records.outboxItems.length,
      metricEvents: records.metricEvents.length,
      archivedFiles: snapshot.filesToArchive.length,
    });
    this.importedTeams.add(teamName);
  }
}
