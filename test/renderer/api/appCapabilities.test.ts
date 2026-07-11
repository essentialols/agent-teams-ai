import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ElectronAPI } from '../../../src/shared/types/api';

function installElectronApi(api: Partial<ElectronAPI>): void {
  Object.defineProperty(window, 'electronAPI', {
    configurable: true,
    value: api,
  });
}

describe('renderer app API capabilities', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'electronAPI');
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('reports hosted-web capabilities when no Electron preload adapter is present', async () => {
    const { getAppCapabilities, isElectronMode, supportsAppCapability } = await import(
      '../../../src/renderer/api'
    );

    expect(isElectronMode()).toBe(false);
    expect(getAppCapabilities()).toEqual({
      runtime: 'hosted-web-http',
      electronPreload: false,
      editorFileWatching: false,
      nativeFilePathLookup: false,
      nativeUpdater: false,
      nativeWindowControls: false,
    });
    expect(supportsAppCapability('editorFileWatching')).toBe(false);
  });

  it('reports Electron preload capabilities and keeps the preload adapter as the API implementation', async () => {
    const setWatchedFiles = vi.fn().mockResolvedValue(undefined);
    const electronApi = {
      editor: {
        watchDir: vi.fn().mockResolvedValue(undefined),
        setWatchedFiles,
        setWatchedDirs: vi.fn().mockResolvedValue(undefined),
      },
      getPathForFile: vi.fn(),
      updater: {
        check: vi.fn().mockResolvedValue(undefined),
        download: vi.fn().mockResolvedValue(undefined),
        install: vi.fn().mockResolvedValue(undefined),
        onStatus: vi.fn(() => vi.fn()),
      },
      windowControls: {
        minimize: vi.fn().mockResolvedValue(undefined),
        maximize: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        isMaximized: vi.fn().mockResolvedValue(false),
        isFullScreen: vi.fn().mockResolvedValue(false),
        relaunch: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as Partial<ElectronAPI>;
    installElectronApi(electronApi);

    const { api, getAppCapabilities, isElectronMode, supportsAppCapability } = await import(
      '../../../src/renderer/api'
    );

    expect(isElectronMode()).toBe(true);
    expect(getAppCapabilities()).toMatchObject({
      runtime: 'electron-preload',
      electronPreload: true,
      editorFileWatching: true,
      nativeFilePathLookup: true,
      nativeUpdater: true,
      nativeWindowControls: true,
    });
    expect(supportsAppCapability('editorFileWatching')).toBe(true);

    await api.editor.setWatchedFiles(['/tmp/example.ts']);

    expect(setWatchedFiles).toHaveBeenCalledWith(['/tmp/example.ts']);
  });
});
