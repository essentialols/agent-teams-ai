import {
  TOKEN_USAGE_GET_SNAPSHOT,
  TOKEN_USAGE_REFRESH_SNAPSHOT,
  TOKEN_USAGE_SNAPSHOT_CHANGED,
  type TokenUsageAnalyticsSnapshotDto,
  type TokenUsageElectronApi,
  type TokenUsageSnapshotRequest,
} from '../contracts';

import type { IpcRenderer, IpcRendererEvent } from 'electron';

export function createTokenUsageBridge(
  ipcRenderer: IpcRenderer
): TokenUsageElectronApi['tokenUsage'] {
  return {
    getSnapshot: (request?: TokenUsageSnapshotRequest) =>
      ipcRenderer.invoke(TOKEN_USAGE_GET_SNAPSHOT, request),
    refreshSnapshot: (request?: TokenUsageSnapshotRequest) =>
      ipcRenderer.invoke(TOKEN_USAGE_REFRESH_SNAPSHOT, request),
    onSnapshotChanged: (callback: (snapshot: TokenUsageAnalyticsSnapshotDto) => void) => {
      const listener = (
        _event: IpcRendererEvent,
        snapshot: TokenUsageAnalyticsSnapshotDto
      ): void => {
        callback(snapshot);
      };
      ipcRenderer.on(TOKEN_USAGE_SNAPSHOT_CHANGED, listener);
      return () => ipcRenderer.removeListener(TOKEN_USAGE_SNAPSHOT_CHANGED, listener);
    },
  };
}
