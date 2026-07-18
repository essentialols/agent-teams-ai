import type {
  ReviewDirectDiskMutationStep,
  ReviewDiskUndoSnapshot,
  ReviewUndoAction,
} from '@shared/types';

export function buildUndoDiskMutationSteps(
  actionId: string,
  snapshots: readonly ReviewDiskUndoSnapshot[]
): ReviewDirectDiskMutationStep[] {
  return snapshots.map((snapshot, index) => {
    if (snapshot.restoreConflict) throw new Error(snapshot.restoreConflict);
    const id = `${actionId}:${index}`;
    const restoreMode =
      snapshot.restoreMode ?? (snapshot.renameExpectation ? 'restore-rejected-rename' : 'content');
    if (restoreMode === 'restore-rejected-rename' || restoreMode === 'reapply-rejected-rename') {
      if (!snapshot.renameExpectation) {
        throw new Error('Rename recovery metadata is unavailable; refusing an unsafe Undo.');
      }
      return {
        id,
        type: restoreMode,
        filePath: snapshot.filePath,
        expectation: snapshot.renameExpectation,
      };
    }
    if (restoreMode === 'delete-file') {
      if (snapshot.afterContent === null) {
        throw new Error('Undo delete snapshot is missing the expected file content.');
      }
      return {
        id,
        type: 'delete',
        filePath: snapshot.filePath,
        expectedContent: snapshot.afterContent,
      };
    }
    if (restoreMode === 'create-file') {
      return {
        id,
        type: 'write',
        filePath: snapshot.filePath,
        expectedContent: null,
        content: snapshot.beforeContent,
      };
    }
    if (snapshot.afterContent === null) {
      throw new Error('Undo snapshot is missing the expected disk postimage.');
    }
    return {
      id,
      type: 'write',
      filePath: snapshot.filePath,
      expectedContent: snapshot.afterContent,
      content: snapshot.beforeContent,
    };
  });
}

export function buildRedoDiskMutationSteps(
  actionId: string,
  snapshots: readonly ReviewDiskUndoSnapshot[]
): ReviewDirectDiskMutationStep[] {
  return snapshots.map((snapshot, index) => {
    if (snapshot.restoreConflict) throw new Error(snapshot.restoreConflict);
    const id = `${actionId}:redo:${index}`;
    const restoreMode =
      snapshot.restoreMode ?? (snapshot.renameExpectation ? 'restore-rejected-rename' : 'content');
    if (restoreMode === 'restore-rejected-rename' || restoreMode === 'reapply-rejected-rename') {
      if (!snapshot.renameExpectation) {
        throw new Error('Rename recovery metadata is unavailable; refusing an unsafe Redo.');
      }
      return {
        id,
        type:
          restoreMode === 'restore-rejected-rename'
            ? 'reapply-rejected-rename'
            : 'restore-rejected-rename',
        filePath: snapshot.filePath,
        expectation: snapshot.renameExpectation,
      };
    }
    if (restoreMode === 'create-file') {
      return {
        id,
        type: 'delete',
        filePath: snapshot.filePath,
        expectedContent: snapshot.beforeContent,
      };
    }
    if (restoreMode === 'delete-file') {
      if (snapshot.afterContent === null) {
        throw new Error('Redo create snapshot is missing the expected file content.');
      }
      return {
        id,
        type: 'write',
        filePath: snapshot.filePath,
        expectedContent: null,
        content: snapshot.afterContent,
      };
    }
    if (snapshot.afterContent === null) {
      throw new Error('Redo snapshot is missing the expected disk postimage.');
    }
    return {
      id,
      type: 'write',
      filePath: snapshot.filePath,
      expectedContent: snapshot.beforeContent,
      content: snapshot.afterContent,
    };
  });
}

/**
 * Builds the original forward Restore/Rename transition from the same durable
 * snapshot Redo uses. Only the journal step identity differs from a Redo.
 */
export function buildForwardDiskMutationSteps(
  actionId: string,
  snapshots: readonly ReviewDiskUndoSnapshot[]
): ReviewDirectDiskMutationStep[] {
  return buildRedoDiskMutationSteps(actionId, snapshots).map((step, index) => ({
    ...step,
    id: `${actionId}:${index}`,
  }));
}

export function getReviewActionDiskSnapshots(action: ReviewUndoAction): ReviewDiskUndoSnapshot[] {
  if (action.kind === 'bulk') return action.diskSnapshots;
  if (action.kind === 'disk') return [action.action.snapshot];
  return [];
}
