import {
  initializeReviewHandlers,
  registerReviewHandlers,
  removeReviewHandlers,
} from '@main/ipc/review';
import {
  REVIEW_APPLY_DECISIONS,
  REVIEW_CHECK_CONFLICT,
  REVIEW_DELETE_EDITED_FILE,
  REVIEW_GET_FILE_CONTENT,
  REVIEW_REJECT_FILE,
  REVIEW_REJECT_HUNKS,
  REVIEW_RESTORE_REJECTED_RENAME,
  REVIEW_SAVE_EDITED_FILE,
} from '@preload/constants/ipcChannels';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { IpcResult } from '@shared/types/ipc';
import type { IpcMain, IpcMainInvokeEvent } from 'electron';

vi.mock('@shared/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

type ReviewHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown;

function createMockIpcMain(): IpcMain & {
  invoke: (channel: string, ...args: unknown[]) => Promise<IpcResult<unknown>>;
} {
  const handlers = new Map<string, ReviewHandler>();
  return {
    handle: vi.fn((channel: string, handler: ReviewHandler) => handlers.set(channel, handler)),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
    invoke: async (channel: string, ...args: unknown[]) => {
      const handler = handlers.get(channel);
      if (!handler) throw new Error(`No handler for ${channel}`);
      return (await handler({} as IpcMainInvokeEvent, ...args)) as IpcResult<unknown>;
    },
  } as unknown as IpcMain & {
    invoke: (channel: string, ...args: unknown[]) => Promise<IpcResult<unknown>>;
  };
}

describe('review IPC path confinement', () => {
  let tmpDir: string;
  let projectDir: string;
  let worktreeDir: string;
  let outsideDir: string;
  let projectFile: string;
  let worktreeFile: string;
  let outsideFile: string;
  let ipcMain: ReturnType<typeof createMockIpcMain>;
  let extractor: {
    getTaskChanges: ReturnType<typeof vi.fn>;
    getAgentChanges: ReturnType<typeof vi.fn>;
  };
  let applier: {
    checkConflict: ReturnType<typeof vi.fn>;
    rejectHunks: ReturnType<typeof vi.fn>;
    rejectFile: ReturnType<typeof vi.fn>;
    applyReviewDecisions: ReturnType<typeof vi.fn>;
    saveEditedFile: ReturnType<typeof vi.fn>;
    deleteEditedFile: ReturnType<typeof vi.fn>;
    restoreRejectedRename: ReturnType<typeof vi.fn>;
    reapplyRejectedRename: ReturnType<typeof vi.fn>;
  };
  let resolver: {
    getFileContent: ReturnType<typeof vi.fn>;
    invalidateFile: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'review-ipc-test-'));
    projectDir = path.join(tmpDir, 'project');
    worktreeDir = path.join(tmpDir, 'worktree');
    outsideDir = path.join(tmpDir, 'outside');
    projectFile = path.join(projectDir, 'src', 'project.ts');
    worktreeFile = path.join(worktreeDir, 'src', 'worktree.ts');
    outsideFile = path.join(outsideDir, 'outside.ts');
    await Promise.all([
      mkdir(path.dirname(projectFile), { recursive: true }),
      mkdir(path.dirname(worktreeFile), { recursive: true }),
      mkdir(outsideDir, { recursive: true }),
    ]);
    await Promise.all([
      writeFile(projectFile, 'project\n', 'utf8'),
      writeFile(worktreeFile, 'worktree\n', 'utf8'),
      writeFile(outsideFile, 'outside\n', 'utf8'),
    ]);

    extractor = {
      getTaskChanges: vi.fn().mockResolvedValue({
        files: [
          {
            filePath: projectFile,
            snippets: [],
            isNewFile: false,
          },
        ],
        scope: { memberName: 'worker' },
      }),
      getAgentChanges: vi.fn().mockResolvedValue({
        files: [
          {
            filePath: projectFile,
            snippets: [],
            isNewFile: false,
          },
          {
            filePath: path.join(projectDir, 'src', 'missing.ts'),
            snippets: [],
            isNewFile: true,
          },
        ],
      }),
    };
    applier = {
      checkConflict: vi.fn().mockResolvedValue({ hasConflict: false }),
      rejectHunks: vi.fn().mockResolvedValue({ success: true }),
      rejectFile: vi.fn().mockResolvedValue({ success: true }),
      applyReviewDecisions: vi
        .fn()
        .mockResolvedValue({ applied: 1, skipped: 0, conflicts: 0, errors: [] }),
      saveEditedFile: vi.fn().mockImplementation(async (_filePath, _content, expectedCurrent) => {
        if (expectedCurrent === 'different\n') {
          throw new Error('File changed since review update; refusing to overwrite');
        }
        return { success: true };
      }),
      deleteEditedFile: vi.fn().mockResolvedValue({ success: true }),
      restoreRejectedRename: vi.fn().mockResolvedValue({ success: true }),
      reapplyRejectedRename: vi.fn().mockResolvedValue({ success: true }),
    };
    resolver = {
      getFileContent: vi
        .fn()
        .mockImplementation(
          async (
            _teamName: string,
            _memberName: string,
            filePath: string,
            snippets: unknown[]
          ) => ({
            filePath,
            relativePath: path.basename(filePath),
            snippets,
            linesAdded: 0,
            linesRemoved: 0,
            isNewFile: false,
            originalFullContent: 'before\n',
            modifiedFullContent: 'after\n',
            contentSource: 'ledger-exact',
          })
        ),
      invalidateFile: vi.fn(),
    };
    initializeReviewHandlers({
      extractor: extractor as never,
      applier: applier as never,
      contentResolver: resolver as never,
      configReader: {
        getConfig: vi.fn().mockResolvedValue({
          name: 'safe-team',
          projectPath: projectDir,
          members: [{ name: 'worker', cwd: worktreeDir }],
        }),
      },
    });
    ipcMain = createMockIpcMain();
    registerReviewHandlers(ipcMain);
  });

  afterEach(async () => {
    removeReviewHandlers(ipcMain);
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('allows content reads inside configured project and member worktree roots', async () => {
    const projectResult = await ipcMain.invoke(
      REVIEW_GET_FILE_CONTENT,
      'safe-team',
      'worker',
      projectFile,
      []
    );
    const worktreeResult = await ipcMain.invoke(
      REVIEW_GET_FILE_CONTENT,
      'safe-team',
      'worker',
      worktreeFile,
      []
    );

    expect(projectResult.success).toBe(true);
    expect(worktreeResult.success).toBe(true);
    expect(resolver.getFileContent).toHaveBeenNthCalledWith(
      1,
      'safe-team',
      'worker',
      projectFile,
      []
    );
    expect(resolver.getFileContent).toHaveBeenNthCalledWith(
      2,
      'safe-team',
      'worker',
      worktreeFile,
      []
    );
  });

  it('blocks traversal and symlink escapes before content resolution', async () => {
    const traversalResult = await ipcMain.invoke(
      REVIEW_GET_FILE_CONTENT,
      'safe-team',
      'worker',
      path.join(projectDir, '..', 'outside', 'outside.ts'),
      []
    );
    expect(traversalResult).toMatchObject({ success: false });
    if (process.platform !== 'win32') {
      const escapePath = path.join(projectDir, 'escape.ts');
      await symlink(outsideFile, escapePath);
      const symlinkResult = await ipcMain.invoke(
        REVIEW_GET_FILE_CONTENT,
        'safe-team',
        'worker',
        escapePath,
        []
      );
      expect(symlinkResult).toMatchObject({ success: false });
    }
    expect(resolver.getFileContent).not.toHaveBeenCalled();
  });

  it('blocks check, reject, and apply mutation paths outside authoritative roots', async () => {
    const scope = { teamName: 'safe-team', memberName: 'worker' };
    const results = await Promise.all([
      ipcMain.invoke(REVIEW_CHECK_CONFLICT, scope, outsideFile, 'outside\n'),
      ipcMain.invoke(REVIEW_REJECT_HUNKS, scope, outsideFile, [0]),
      ipcMain.invoke(REVIEW_REJECT_FILE, scope, outsideFile),
      ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
        teamName: 'safe-team',
        memberName: 'worker',
        decisions: [
          {
            filePath: outsideFile,
            fileDecision: 'rejected',
            hunkDecisions: { 0: 'rejected' },
            snippets: [],
            originalFullContent: 'before\n',
            modifiedFullContent: 'after\n',
          },
        ],
      }),
    ]);

    expect(results.every((result) => result.success === false)).toBe(true);
    expect(applier.checkConflict).not.toHaveBeenCalled();
    expect(applier.rejectHunks).not.toHaveBeenCalled();
    expect(applier.rejectFile).not.toHaveBeenCalled();
    expect(applier.applyReviewDecisions).not.toHaveBeenCalled();
  });

  it('allows check, reject, and apply mutation paths inside the configured project', async () => {
    const scope = { teamName: 'safe-team', memberName: 'worker' };
    const checkResult = await ipcMain.invoke(
      REVIEW_CHECK_CONFLICT,
      scope,
      projectFile,
      'project\n'
    );
    const rejectHunksResult = await ipcMain.invoke(REVIEW_REJECT_HUNKS, scope, projectFile, [0]);
    const rejectFileResult = await ipcMain.invoke(REVIEW_REJECT_FILE, scope, projectFile);
    const applyResult = await ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
      teamName: 'safe-team',
      memberName: 'worker',
      decisions: [
        {
          filePath: projectFile,
          fileDecision: 'rejected',
          hunkDecisions: { 0: 'rejected' },
          snippets: [],
          originalFullContent: 'before\n',
          modifiedFullContent: 'project\n',
        },
      ],
    });

    expect(checkResult.success).toBe(true);
    expect(rejectHunksResult.success).toBe(true);
    expect(rejectFileResult.success).toBe(true);
    expect(applyResult.success).toBe(true);
    expect(applier.checkConflict).toHaveBeenCalledWith(projectFile, 'project\n');
    expect(applier.rejectHunks).toHaveBeenCalledWith(
      'safe-team',
      projectFile,
      'before\n',
      'after\n',
      [0],
      []
    );
    expect(applier.rejectFile).toHaveBeenCalledWith(
      'safe-team',
      projectFile,
      'before\n',
      'after\n'
    );
    expect(applier.applyReviewDecisions).toHaveBeenCalledTimes(1);
  });

  it('requires task-scoped mutations to target a file in that reviewed task', async () => {
    const result = await ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
      teamName: 'safe-team',
      taskId: 'task-1',
      decisions: [
        {
          filePath: worktreeFile,
          fileDecision: 'rejected',
          hunkDecisions: { 0: 'rejected' },
          snippets: [],
          originalFullContent: 'before\n',
          modifiedFullContent: 'after\n',
        },
      ],
    });

    expect(result).toMatchObject({
      success: false,
      error: 'File is not part of the reviewed scope',
    });
    expect(extractor.getTaskChanges).toHaveBeenCalledWith('safe-team', 'task-1');
    expect(applier.applyReviewDecisions).not.toHaveBeenCalled();
  });

  it('rejects malformed review request shapes before invoking services', async () => {
    const result = await ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
      teamName: 'safe-team',
      memberName: 'worker',
      decisions: [
        {
          filePath: projectFile,
          fileDecision: 'rejected',
          hunkDecisions: { nope: 'rejected' },
          snippets: [],
        },
      ],
    });

    expect(result).toMatchObject({ success: false, error: 'Invalid hunk decision' });
    expect(applier.applyReviewDecisions).not.toHaveBeenCalled();
  });

  it('blocks authoritative ledger relations whose secondary path is not a reviewed member', async () => {
    extractor.getTaskChanges.mockResolvedValueOnce({
      files: [
        {
          filePath: projectFile,
          isNewFile: false,
          snippets: [
            {
              toolUseId: 'rename-1',
              filePath: projectFile,
              toolName: 'Bash',
              type: 'shell-snapshot',
              oldString: 'project\n',
              newString: 'project\n',
              replaceAll: false,
              timestamp: '2026-07-16T00:00:00.000Z',
              isError: false,
              ledger: {
                relation: {
                  kind: 'rename',
                  oldPath: 'src/project.ts',
                  newPath: 'src/unrelated.ts',
                },
              },
            },
          ],
        },
      ],
      scope: { memberName: 'worker' },
    });
    const result = await ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
      teamName: 'safe-team',
      taskId: 'task-1',
      decisions: [
        {
          filePath: projectFile,
          fileDecision: 'rejected',
          hunkDecisions: { 0: 'rejected' },
        },
      ],
    });

    expect(result).toMatchObject({ success: false });
    expect(applier.applyReviewDecisions).not.toHaveBeenCalled();
  });

  it('allows an authoritative relation when both paths are exact reviewed members', async () => {
    const oldPath = path.join(projectDir, 'src', 'old.ts');
    const relation = {
      kind: 'rename' as const,
      oldPath: 'src/old.ts',
      newPath: 'src/project.ts',
    };
    extractor.getTaskChanges.mockResolvedValueOnce({
      files: [
        {
          filePath: projectFile,
          isNewFile: false,
          snippets: [
            {
              toolUseId: 'rename-new',
              filePath: projectFile,
              toolName: 'Bash',
              type: 'shell-snapshot',
              oldString: 'before\n',
              newString: 'after\n',
              replaceAll: false,
              timestamp: '2026-07-16T00:00:00.000Z',
              isError: false,
              ledger: { relation },
            },
            {
              toolUseId: 'rename-old',
              filePath: oldPath,
              toolName: 'Bash',
              type: 'shell-snapshot',
              oldString: 'before\n',
              newString: '',
              replaceAll: false,
              timestamp: '2026-07-16T00:00:00.000Z',
              isError: false,
            },
          ],
        },
      ],
      scope: { memberName: 'worker' },
    });

    const result = await ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
      teamName: 'safe-team',
      taskId: 'task-1',
      decisions: [
        {
          filePath: projectFile,
          fileDecision: 'rejected',
          hunkDecisions: { 0: 'rejected' },
        },
      ],
    });

    expect(result).toMatchObject({ success: true });
    expect(applier.applyReviewDecisions).toHaveBeenCalledTimes(1);
  });

  it('ignores renderer-forged lifecycle, contents, and relation metadata', async () => {
    const result = await ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
      teamName: 'safe-team',
      memberName: 'worker',
      decisions: [
        {
          filePath: projectFile,
          fileDecision: 'rejected',
          hunkDecisions: { 0: 'rejected' },
          isNewFile: true,
          originalFullContent: '',
          modifiedFullContent: 'forged\n',
          snippets: [
            {
              toolUseId: 'forged-create',
              filePath: projectFile,
              toolName: 'Write',
              type: 'write-new',
              oldString: '',
              newString: 'forged\n',
              replaceAll: false,
              timestamp: '2026-07-16T00:00:00.000Z',
              isError: false,
              ledger: {
                relation: {
                  kind: 'rename',
                  oldPath: 'src/project.ts',
                  newPath: 'src/unrelated.ts',
                },
              },
            },
          ],
        },
      ],
    });

    expect(result).toMatchObject({ success: true });
    const [, fileContents] = applier.applyReviewDecisions.mock.calls[0] as [
      unknown,
      Map<string, { isNewFile: boolean; snippets: unknown[]; originalFullContent: string | null }>,
    ];
    expect(fileContents.get(projectFile)).toMatchObject({
      isNewFile: false,
      snippets: [],
      originalFullContent: 'before\n',
    });
  });

  it('uses resolver lifecycle evidence instead of the summary isNewFile flag', async () => {
    resolver.getFileContent.mockResolvedValueOnce({
      filePath: projectFile,
      relativePath: 'src/project.ts',
      snippets: [],
      linesAdded: 1,
      linesRemoved: 0,
      isNewFile: true,
      originalFullContent: '',
      modifiedFullContent: 'created\n',
      contentSource: 'ledger-exact',
    });

    const result = await ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
      teamName: 'safe-team',
      memberName: 'worker',
      decisions: [
        {
          filePath: projectFile,
          fileDecision: 'rejected',
          hunkDecisions: { 0: 'rejected' },
        },
      ],
    });

    expect(result).toMatchObject({ success: true });
    const [, fileContents] = applier.applyReviewDecisions.mock.calls[0] as [
      unknown,
      Map<string, { isNewFile: boolean }>,
    ];
    expect(fileContents.get(projectFile)?.isNewFile).toBe(true);
  });

  it('requires a task or member identity for every mutation scope', async () => {
    const scope = { teamName: 'safe-team' };
    const results = await Promise.all([
      ipcMain.invoke(REVIEW_CHECK_CONFLICT, scope, projectFile, 'project\n'),
      ipcMain.invoke(REVIEW_REJECT_HUNKS, scope, projectFile, [0]),
      ipcMain.invoke(REVIEW_REJECT_FILE, scope, projectFile),
      ipcMain.invoke(REVIEW_APPLY_DECISIONS, {
        ...scope,
        decisions: [
          {
            filePath: projectFile,
            fileDecision: 'rejected',
            hunkDecisions: { 0: 'rejected' },
          },
        ],
      }),
      ipcMain.invoke(REVIEW_SAVE_EDITED_FILE, scope, projectFile, 'forged\n'),
    ]);

    expect(results).toHaveLength(5);
    for (const result of results) {
      expect(result).toMatchObject({
        success: false,
        error: 'Review mutation requires taskId or memberName',
      });
    }
  });

  it('does not trust forged project roots or allow unrelated files inside configured roots', async () => {
    const forgedRoot = await ipcMain.invoke(
      REVIEW_SAVE_EDITED_FILE,
      { teamName: 'safe-team', memberName: 'worker', projectPath: outsideDir },
      outsideFile,
      'forged\n'
    );
    const unrelated = await ipcMain.invoke(
      REVIEW_SAVE_EDITED_FILE,
      { teamName: 'safe-team', memberName: 'worker' },
      worktreeFile,
      'unrelated\n'
    );

    expect(forgedRoot).toMatchObject({
      success: false,
      error: 'File is not part of the reviewed scope',
    });
    expect(unrelated).toMatchObject({
      success: false,
      error: 'File is not part of the reviewed scope',
    });
    expect(applier.saveEditedFile).not.toHaveBeenCalled();
  });

  it('rejects a renderer member that conflicts with the authoritative task scope', async () => {
    const result = await ipcMain.invoke(
      REVIEW_SAVE_EDITED_FILE,
      {
        teamName: 'safe-team',
        taskId: 'task-1',
        memberName: 'other-worker',
      },
      projectFile,
      'forged\n'
    );

    expect(result).toMatchObject({
      success: false,
      error: 'Review memberName does not match the authoritative task scope',
    });
    expect(applier.saveEditedFile).not.toHaveBeenCalled();
  });

  it('uses expectedCurrentContent as a compare-and-set guard for edited saves', async () => {
    const scope = { teamName: 'safe-team', memberName: 'worker' };
    const allowed = await ipcMain.invoke(
      REVIEW_SAVE_EDITED_FILE,
      scope,
      projectFile,
      'restored\n',
      'project\n'
    );
    const conflict = await ipcMain.invoke(
      REVIEW_SAVE_EDITED_FILE,
      scope,
      projectFile,
      'stale restore\n',
      'different\n'
    );
    const missingFile = path.join(projectDir, 'src', 'missing.ts');
    const restoreMissing = await ipcMain.invoke(
      REVIEW_SAVE_EDITED_FILE,
      scope,
      missingFile,
      'created\n',
      null
    );
    let symlinkEscape: IpcResult<unknown> | null = null;
    if (process.platform !== 'win32') {
      const escapeDir = path.join(projectDir, 'escape-dir');
      await symlink(outsideDir, escapeDir);
      symlinkEscape = await ipcMain.invoke(
        REVIEW_SAVE_EDITED_FILE,
        scope,
        path.join(escapeDir, 'missing.ts'),
        'escaped\n',
        null
      );
    }

    expect(allowed).toMatchObject({ success: true });
    expect(conflict).toMatchObject({
      success: false,
      error: 'File changed since review update; refusing to overwrite',
    });
    expect(restoreMissing).toMatchObject({ success: true });
    if (symlinkEscape) {
      expect(symlinkEscape).toMatchObject({ success: false });
    }
    expect(applier.saveEditedFile).toHaveBeenCalledTimes(3);
    expect(applier.saveEditedFile).toHaveBeenNthCalledWith(
      1,
      projectFile,
      'restored\n',
      'project\n'
    );
    expect(applier.saveEditedFile).toHaveBeenNthCalledWith(
      2,
      projectFile,
      'stale restore\n',
      'different\n'
    );
    expect(applier.saveEditedFile).toHaveBeenNthCalledWith(3, missingFile, 'created\n', null);
  });

  it('confines guarded Undo deletion to an authoritative reviewed file', async () => {
    const scope = { teamName: 'safe-team', memberName: 'worker' };
    const allowed = await ipcMain.invoke(
      REVIEW_DELETE_EDITED_FILE,
      scope,
      projectFile,
      'restored\n'
    );
    const unrelated = await ipcMain.invoke(
      REVIEW_DELETE_EDITED_FILE,
      scope,
      worktreeFile,
      'restored\n'
    );
    const invalid = await ipcMain.invoke(REVIEW_DELETE_EDITED_FILE, scope, projectFile, null);

    expect(allowed).toEqual({ success: true, data: { success: true } });
    expect(unrelated).toMatchObject({
      success: false,
      error: 'File is not part of the reviewed scope',
    });
    expect(invalid).toEqual({ success: false, error: 'Invalid parameters' });
    expect(applier.deleteEditedFile).toHaveBeenCalledTimes(1);
    expect(applier.deleteEditedFile).toHaveBeenCalledWith(projectFile, 'restored\n');
  });

  it('restores a rejected rename only from authoritative review metadata', async () => {
    const oldFile = path.join(projectDir, 'src', 'old.ts');
    const relation = { kind: 'rename' as const, oldPath: oldFile, newPath: projectFile };
    const expectation = {
      eventId: 'rename-old',
      beforeHash: null,
      afterHash: null,
      relation,
    };
    const snippets = [
      {
        toolUseId: 'rename-old',
        filePath: oldFile,
        toolName: 'Bash' as const,
        type: 'shell-snapshot' as const,
        oldString: 'before\n',
        newString: '',
        replaceAll: false,
        timestamp: '2026-07-17T10:00:00.000Z',
        isError: false,
        ledger: {
          eventId: 'rename-old',
          source: 'ledger-snapshot' as const,
          confidence: 'high' as const,
          originalFullContent: 'before\n',
          modifiedFullContent: null,
          beforeHash: null,
          afterHash: null,
          operation: 'delete' as const,
          relation,
        },
      },
      {
        toolUseId: 'rename-new',
        filePath: projectFile,
        toolName: 'Bash' as const,
        type: 'shell-snapshot' as const,
        oldString: '',
        newString: 'after\n',
        replaceAll: false,
        timestamp: '2026-07-17T10:00:01.000Z',
        isError: false,
        ledger: {
          eventId: 'rename-new',
          source: 'ledger-snapshot' as const,
          confidence: 'high' as const,
          originalFullContent: null,
          modifiedFullContent: 'after\n',
          beforeHash: null,
          afterHash: null,
          operation: 'create' as const,
          relation,
        },
      },
    ];
    extractor.getAgentChanges.mockResolvedValueOnce({
      files: [{ filePath: projectFile, snippets, isNewFile: false }],
    });
    resolver.getFileContent.mockResolvedValueOnce({
      filePath: projectFile,
      relativePath: 'src/project.ts',
      snippets,
      linesAdded: 1,
      linesRemoved: 1,
      isNewFile: false,
      originalFullContent: 'before\n',
      modifiedFullContent: 'after\n',
      contentSource: 'ledger-snapshot',
    });

    const result = await ipcMain.invoke(
      REVIEW_RESTORE_REJECTED_RENAME,
      { teamName: 'safe-team', memberName: 'worker' },
      projectFile,
      expectation
    );

    expect(result).toEqual({ success: true, data: { success: true } });
    expect(applier.restoreRejectedRename).toHaveBeenCalledWith(
      projectFile,
      'before\n',
      'after\n',
      snippets
    );
    expect(resolver.invalidateFile).toHaveBeenCalledWith(oldFile);
    expect(resolver.invalidateFile).toHaveBeenCalledWith(projectFile);

    applier.restoreRejectedRename.mockClear();
    extractor.getAgentChanges.mockResolvedValueOnce({
      files: [{ filePath: projectFile, snippets, isNewFile: false }],
    });
    const stale = await ipcMain.invoke(
      REVIEW_RESTORE_REJECTED_RENAME,
      { teamName: 'safe-team', memberName: 'worker' },
      projectFile,
      { ...expectation, eventId: 'stale-event' }
    );

    expect(stale).toEqual({
      success: false,
      error: 'Review changes were updated; refusing stale rename recovery',
    });
    expect(applier.restoreRejectedRename).not.toHaveBeenCalled();

    applier.restoreRejectedRename.mockRejectedValueOnce(new Error('rollback incomplete'));
    resolver.invalidateFile.mockClear();
    extractor.getAgentChanges.mockResolvedValueOnce({
      files: [{ filePath: projectFile, snippets, isNewFile: false }],
    });
    const failed = await ipcMain.invoke(
      REVIEW_RESTORE_REJECTED_RENAME,
      { teamName: 'safe-team', memberName: 'worker' },
      projectFile,
      expectation
    );

    expect(failed).toEqual({ success: false, error: 'rollback incomplete' });
    expect(resolver.invalidateFile).toHaveBeenCalledWith(oldFile);
    expect(resolver.invalidateFile).toHaveBeenCalledWith(projectFile);
  });
});
