import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEditorSlice } from '../../../src/renderer/store/slices/editorSlice';

import type { EditorSlice } from '../../../src/renderer/store/slices/editorSlice';
import type { AppState } from '../../../src/renderer/store/types';

const mockEditorAPI = {
  watchDir: vi.fn(),
  setWatchedFiles: vi.fn(),
  setWatchedDirs: vi.fn(),
};

const mockSupportsAppCapability = vi.fn((_capability: string) => true);

vi.mock('@renderer/api', () => ({
  api: {
    editor: {
      watchDir: (...args: unknown[]) => mockEditorAPI.watchDir(...args),
      setWatchedFiles: (...args: unknown[]) => mockEditorAPI.setWatchedFiles(...args),
      setWatchedDirs: (...args: unknown[]) => mockEditorAPI.setWatchedDirs(...args),
    },
  },
  supportsAppCapability: (capability: string) => mockSupportsAppCapability(capability),
}));

vi.mock('@renderer/utils/editorBridge', () => ({
  editorBridge: {
    deleteState: vi.fn(),
    destroy: vi.fn(),
    getAllModifiedContent: vi.fn(),
    getContent: vi.fn(),
    remapState: vi.fn(),
  },
}));

vi.mock('@renderer/utils/codemirrorLanguages', () => ({
  getLanguageFromFileName: () => 'Plain Text',
}));

vi.mock('@shared/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

const PROJECT_PATH = '/Users/test/my-project';

interface Harness {
  getState: () => AppState;
  setState: (partial: Partial<AppState>) => void;
}

function createHarness(): Harness {
  let state = {} as AppState;
  const set = (partial: Partial<AppState> | ((current: AppState) => Partial<AppState>)): void => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = (): AppState => state;
  const slice = createEditorSlice(set, get, {} as never) as EditorSlice;
  state = { ...state, ...slice } as AppState;

  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial };
    },
  };
}

describe('editorSlice app capabilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSupportsAppCapability.mockReturnValue(true);
  });

  it('syncs watched files and directories through the renderer API abstraction', async () => {
    vi.useFakeTimers();
    try {
      mockEditorAPI.watchDir.mockResolvedValue(undefined);
      mockEditorAPI.setWatchedFiles.mockResolvedValue(undefined);
      mockEditorAPI.setWatchedDirs.mockResolvedValue(undefined);
      const harness = createHarness();
      harness.setState({ editorProjectPath: PROJECT_PATH });

      await harness.getState().toggleWatcher(true);
      harness.getState().openFile(`${PROJECT_PATH}/src/index.ts`);
      vi.runAllTimers();

      expect(mockSupportsAppCapability).toHaveBeenCalledWith('editorFileWatching');
      expect(mockEditorAPI.watchDir).toHaveBeenCalledWith(true);
      expect(mockEditorAPI.setWatchedFiles).toHaveBeenLastCalledWith([
        `${PROJECT_PATH}/src/index.ts`,
      ]);
      expect(mockEditorAPI.setWatchedDirs).toHaveBeenLastCalledWith([PROJECT_PATH]);
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('does not call the editor watcher adapter when the capability is unavailable', async () => {
    vi.useFakeTimers();
    try {
      mockSupportsAppCapability.mockReturnValue(false);
      const harness = createHarness();
      harness.setState({
        editorProjectPath: PROJECT_PATH,
        editorWatcherEnabled: true,
      });

      await harness.getState().toggleWatcher(true);
      harness.getState().openFile(`${PROJECT_PATH}/src/index.ts`);
      vi.runAllTimers();

      expect(harness.getState().editorWatcherEnabled).toBe(false);
      expect(mockEditorAPI.watchDir).not.toHaveBeenCalled();
      expect(mockEditorAPI.setWatchedFiles).not.toHaveBeenCalled();
      expect(mockEditorAPI.setWatchedDirs).not.toHaveBeenCalled();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });
});
