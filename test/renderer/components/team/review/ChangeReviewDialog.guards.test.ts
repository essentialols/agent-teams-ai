import { describe, expect, it } from 'vitest';

import {
  buildFileAcceptActionTime,
  canRunScopedNewFileUndo,
  getReviewCloseBlockReason,
  isReviewActionLocked,
  partitionReviewFilesByApplyErrors,
  reconcileReviewDecisionRecordsAfterApply,
  resolveReviewFileIsNew,
  restoreReviewDecisionRecordsForFile,
  restoreReviewDecisionRecordsForFiles,
  shouldUndoLatestDecisionSnapshot,
  shouldUndoRemovedNewFile,
} from '../../../../../src/renderer/components/team/review/ChangeReviewDialog';

function makeFile(filePath: string, changeKey?: string) {
  return {
    filePath,
    relativePath: filePath.split('/').pop() ?? filePath,
    changeKey,
    snippets: [],
    linesAdded: 1,
    linesRemoved: 1,
    isNewFile: false,
  };
}

describe('ChangeReviewDialog interaction guards', () => {
  it.each([
    { applying: true, fileApplyCount: 0, undoing: false, closing: false },
    { applying: false, fileApplyCount: 1, undoing: false, closing: false },
    { applying: false, fileApplyCount: 0, undoing: true, closing: false },
    { applying: false, fileApplyCount: 0, undoing: false, closing: true },
  ])('locks every review action for any in-flight mutation: %o', (state) => {
    expect(isReviewActionLocked(state)).toBe(true);
  });

  it('allows review actions only when all mutation lanes are idle', () => {
    expect(
      isReviewActionLocked({
        applying: false,
        fileApplyCount: 0,
        undoing: false,
        closing: false,
      })
    ).toBe(false);
  });

  it('blocks close for drafts and in-flight actions instead of silently discarding state', () => {
    expect(getReviewCloseBlockReason({ busy: true, draftCount: 0 })).toContain('current');
    expect(getReviewCloseBlockReason({ busy: false, draftCount: 1 })).toContain('Save or discard');
    expect(getReviewCloseBlockReason({ busy: false, draftCount: 0 })).toBeNull();
  });

  it('prefers resolved content when legacy summary new-file metadata disagrees', () => {
    const file = makeFile('/repo/file.ts');
    expect(
      resolveReviewFileIsNew(file, {
        ...file,
        isNewFile: true,
        originalFullContent: '',
        modifiedFullContent: 'created',
        contentSource: 'disk-current',
      })
    ).toBe(true);
  });

  it('rejects stale new-file Undo before any disk call can start', () => {
    expect(canRunScopedNewFileUndo(4, 3, true)).toBe(false);
    expect(canRunScopedNewFileUndo(3, 3, false)).toBe(false);
    expect(canRunScopedNewFileUndo(3, 3, true)).toBe(true);
  });

  it('partitions a mixed Reject All result so only successful files are finalized', () => {
    const first = makeFile('/repo/first.ts');
    const second = makeFile('/repo/second.ts');

    expect(partitionReviewFilesByApplyErrors([first, second], ['/repo/second.ts'])).toEqual({
      successful: [first],
      failed: [second],
    });
    expect(partitionReviewFilesByApplyErrors([first, second], null)).toEqual({
      successful: [],
      failed: [first, second],
    });
  });

  it('fails closed when a Reject All error cannot be attributed to a requested file', () => {
    const files = [makeFile('/repo/first.ts'), makeFile('/repo/second.ts')];
    expect(partitionReviewFilesByApplyErrors(files, ['/repo/rename-source.ts'])).toEqual({
      successful: [],
      failed: files,
    });
    expect(
      partitionReviewFilesByApplyErrors(files, ['/repo/second.ts', '/repo/rename-source.ts'])
    ).toEqual({
      successful: [],
      failed: files,
    });
  });

  it('restores only the failed file decisions, including ledger changeKey entries', () => {
    const file = makeFile('/repo/new.ts', 'rename:/repo/old.ts->/repo/new.ts');
    const restored = restoreReviewDecisionRecordsForFile(
      file,
      {
        hunkDecisions: {
          'rename:/repo/old.ts->/repo/new.ts:0': 'rejected',
          '/repo/other.ts:0': 'rejected',
        },
        fileDecisions: {
          'rename:/repo/old.ts->/repo/new.ts': 'rejected',
          '/repo/other.ts': 'rejected',
        },
      },
      {
        hunkDecisions: {
          'rename:/repo/old.ts->/repo/new.ts:0': 'accepted',
          '/repo/other.ts:0': 'pending',
        },
        fileDecisions: {
          'rename:/repo/old.ts->/repo/new.ts': 'pending',
          '/repo/other.ts': 'pending',
        },
      }
    );

    expect(restored.hunkDecisions).toEqual({
      'rename:/repo/old.ts->/repo/new.ts:0': 'accepted',
      '/repo/other.ts:0': 'rejected',
    });
    expect(restored.fileDecisions).toEqual({
      'rename:/repo/old.ts->/repo/new.ts': 'pending',
      '/repo/other.ts': 'rejected',
    });
  });

  it('keeps successful Reject All decisions and rolls back only failed files', () => {
    const first = makeFile('/repo/first.ts');
    const second = makeFile('/repo/second.ts');
    const result = reconcileReviewDecisionRecordsAfterApply(
      [first, second],
      [second.filePath],
      {
        hunkDecisions: {
          [`${first.filePath}:0`]: 'rejected',
          [`${second.filePath}:0`]: 'rejected',
        },
        fileDecisions: {
          [first.filePath]: 'rejected',
          [second.filePath]: 'rejected',
        },
      },
      {
        hunkDecisions: {},
        fileDecisions: {},
      }
    );

    expect(result.successful).toEqual([first]);
    expect(result.failed).toEqual([second]);
    expect(result.hunkDecisions).toEqual({ [`${first.filePath}:0`]: 'rejected' });
    expect(result.fileDecisions).toEqual({ [first.filePath]: 'rejected' });
  });

  it('restores decisions only for files whose bulk disk Undo succeeded', () => {
    const first = makeFile('/repo/first.ts');
    const second = makeFile('/repo/second.ts');
    const restored = restoreReviewDecisionRecordsForFiles(
      [first],
      {
        hunkDecisions: {
          [`${first.filePath}:0`]: 'rejected',
          [`${second.filePath}:0`]: 'rejected',
        },
        fileDecisions: {
          [first.filePath]: 'rejected',
          [second.filePath]: 'rejected',
        },
      },
      {
        hunkDecisions: {
          [`${first.filePath}:0`]: 'accepted',
          [`${second.filePath}:0`]: 'accepted',
        },
        fileDecisions: {
          [first.filePath]: 'accepted',
          [second.filePath]: 'accepted',
        },
      }
    );

    expect(restored.hunkDecisions).toEqual({
      [`${first.filePath}:0`]: 'accepted',
      [`${second.filePath}:0`]: 'rejected',
    });
    expect(restored.fileDecisions).toEqual({
      [first.filePath]: 'accepted',
      [second.filePath]: 'rejected',
    });
  });

  it('keeps file Accept timestamps identical so Cmd+Z chooses persisted decision Undo', () => {
    const action = buildFileAcceptActionTime(1234);
    expect(action).toEqual({ bulkAt: 1234, fileAt: 1234 });
    expect(
      shouldUndoLatestDecisionSnapshot({
        snapshotActionAt: action.bulkAt,
        lastHunkAt: 1200,
        lastFileAt: action.fileAt,
        lastEditorInteractionAt: 1200,
      })
    ).toBe(true);
  });

  it('undoes a removed new file unless a newer editor interaction happened', () => {
    expect(
      shouldUndoRemovedNewFile({
        removedAt: 200,
        lastReviewActionAt: 200,
        lastEditorInteractionAt: 100,
        hasSnapshot: true,
      })
    ).toBe(true);
    expect(
      shouldUndoRemovedNewFile({
        removedAt: 200,
        lastReviewActionAt: 200,
        lastEditorInteractionAt: 201,
        hasSnapshot: true,
      })
    ).toBe(false);
    expect(
      shouldUndoRemovedNewFile({
        removedAt: 200,
        lastReviewActionAt: 200,
        lastEditorInteractionAt: 100,
        hasSnapshot: false,
      })
    ).toBe(false);
  });
});
