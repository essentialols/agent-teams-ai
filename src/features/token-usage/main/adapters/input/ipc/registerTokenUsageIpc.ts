import { createLogger } from '@shared/utils/logger';

import {
  normalizeTokenUsageSnapshot,
  TOKEN_USAGE_GET_SNAPSHOT,
  TOKEN_USAGE_REFRESH_SNAPSHOT,
  TOKEN_USAGE_SNAPSHOT_CHANGED,
  type TokenUsageAnalyticsSnapshotDto,
  type TokenUsageSnapshotRequest,
} from '../../../../contracts';

import type { TokenUsageFeatureFacade } from '../../../composition/createTokenUsageFeature';
import type { IpcMain } from 'electron';

const logger = createLogger('Feature:TokenUsage:IPC');

export function registerTokenUsageIpc(ipcMain: IpcMain, feature: TokenUsageFeatureFacade): void {
  ipcMain.handle(
    TOKEN_USAGE_GET_SNAPSHOT,
    async (
      _event,
      request?: TokenUsageSnapshotRequest
    ): Promise<TokenUsageAnalyticsSnapshotDto> => {
      try {
        const snapshot = await feature.getSnapshot(request);
        return normalizeTokenUsageSnapshot(snapshot) ?? snapshot;
      } catch (error) {
        logger.error('Failed to get token usage snapshot', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    TOKEN_USAGE_REFRESH_SNAPSHOT,
    async (event, request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto> => {
      try {
        const snapshot = await feature.refreshSnapshot(request);
        event.sender.send(TOKEN_USAGE_SNAPSHOT_CHANGED, snapshot);
        return normalizeTokenUsageSnapshot(snapshot) ?? snapshot;
      } catch (error) {
        logger.error('Failed to refresh token usage snapshot', error);
        throw error;
      }
    }
  );
}

export function removeTokenUsageIpc(ipcMain: IpcMain): void {
  ipcMain.removeHandler(TOKEN_USAGE_GET_SNAPSHOT);
  ipcMain.removeHandler(TOKEN_USAGE_REFRESH_SNAPSHOT);
}
