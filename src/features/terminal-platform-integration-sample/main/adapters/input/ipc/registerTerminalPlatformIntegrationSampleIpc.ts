import {
  TERMINAL_PLATFORM_SAMPLE_CREATE_NATIVE_SESSION,
  TERMINAL_PLATFORM_SAMPLE_GET_STATUS,
  TERMINAL_PLATFORM_SAMPLE_SCREEN_SNAPSHOT,
  TERMINAL_PLATFORM_SAMPLE_SEND_INPUT,
  TERMINAL_PLATFORM_SAMPLE_START,
  TERMINAL_PLATFORM_SAMPLE_STOP,
  type TerminalPlatformCreateNativeSessionRequest,
  type TerminalPlatformIntegrationStatus,
  type TerminalPlatformScreenSnapshot,
  type TerminalPlatformScreenSnapshotRequest,
  type TerminalPlatformSendInputRequest,
  type TerminalPlatformSessionSummary,
} from '@features/terminal-platform-integration-sample/contracts';
import { getErrorMessage } from '@shared/utils/errorHandling';
import { createLogger } from '@shared/utils/logger';

import type { TerminalPlatformIntegrationSampleFeatureFacade } from '../../../composition/createTerminalPlatformIntegrationSampleFeature';
import type { IpcResult } from '@shared/types';
import type { IpcMain, IpcMainInvokeEvent } from 'electron';

const logger = createLogger('Feature:terminal-platform-sample:ipc');

export function registerTerminalPlatformIntegrationSampleIpc(
  ipcMain: IpcMain,
  feature: TerminalPlatformIntegrationSampleFeatureFacade
): void {
  ipcMain.handle(
    TERMINAL_PLATFORM_SAMPLE_GET_STATUS,
    (_event: IpcMainInvokeEvent): IpcResult<TerminalPlatformIntegrationStatus> =>
      withSyncIpcResult(() => feature.getStatus())
  );
  ipcMain.handle(
    TERMINAL_PLATFORM_SAMPLE_START,
    (_event: IpcMainInvokeEvent): Promise<IpcResult<TerminalPlatformIntegrationStatus>> =>
      withIpcResult(() => feature.start())
  );
  ipcMain.handle(
    TERMINAL_PLATFORM_SAMPLE_STOP,
    (_event: IpcMainInvokeEvent): Promise<IpcResult<TerminalPlatformIntegrationStatus>> =>
      withIpcResult(() => feature.stop())
  );
  ipcMain.handle(
    TERMINAL_PLATFORM_SAMPLE_CREATE_NATIVE_SESSION,
    (
      _event: IpcMainInvokeEvent,
      request?: TerminalPlatformCreateNativeSessionRequest
    ): Promise<IpcResult<TerminalPlatformSessionSummary>> =>
      withIpcResult(() => feature.createNativeSession(request))
  );
  ipcMain.handle(
    TERMINAL_PLATFORM_SAMPLE_SEND_INPUT,
    (
      _event: IpcMainInvokeEvent,
      request: TerminalPlatformSendInputRequest
    ): Promise<IpcResult<void>> => withIpcResult(() => feature.sendInput(request))
  );
  ipcMain.handle(
    TERMINAL_PLATFORM_SAMPLE_SCREEN_SNAPSHOT,
    (
      _event: IpcMainInvokeEvent,
      request: TerminalPlatformScreenSnapshotRequest
    ): Promise<IpcResult<TerminalPlatformScreenSnapshot>> =>
      withIpcResult(() => feature.screenSnapshot(request))
  );
  logger.info('Terminal Platform integration sample IPC handlers registered');
}

export function removeTerminalPlatformIntegrationSampleIpc(ipcMain: IpcMain): void {
  ipcMain.removeHandler(TERMINAL_PLATFORM_SAMPLE_GET_STATUS);
  ipcMain.removeHandler(TERMINAL_PLATFORM_SAMPLE_START);
  ipcMain.removeHandler(TERMINAL_PLATFORM_SAMPLE_STOP);
  ipcMain.removeHandler(TERMINAL_PLATFORM_SAMPLE_CREATE_NATIVE_SESSION);
  ipcMain.removeHandler(TERMINAL_PLATFORM_SAMPLE_SEND_INPUT);
  ipcMain.removeHandler(TERMINAL_PLATFORM_SAMPLE_SCREEN_SNAPSHOT);
  logger.info('Terminal Platform integration sample IPC handlers removed');
}

async function withIpcResult<T>(work: () => Promise<T>): Promise<IpcResult<T>> {
  try {
    return { success: true, data: await work() };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

function withSyncIpcResult<T>(work: () => T): IpcResult<T> {
  try {
    return { success: true, data: work() };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
