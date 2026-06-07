import {
  TERMINAL_PLATFORM_SAMPLE_CREATE_NATIVE_SESSION,
  TERMINAL_PLATFORM_SAMPLE_GET_STATUS,
  TERMINAL_PLATFORM_SAMPLE_SCREEN_SNAPSHOT,
  TERMINAL_PLATFORM_SAMPLE_SEND_INPUT,
  TERMINAL_PLATFORM_SAMPLE_START,
  TERMINAL_PLATFORM_SAMPLE_STOP,
  type TerminalPlatformCreateNativeSessionRequest,
  type TerminalPlatformIntegrationSampleApi,
  type TerminalPlatformIntegrationStatus,
  type TerminalPlatformScreenSnapshot,
  type TerminalPlatformScreenSnapshotRequest,
  type TerminalPlatformSendInputRequest,
  type TerminalPlatformSessionSummary,
} from '@features/terminal-platform-integration-sample/contracts';

import type { IpcResult } from '@shared/types';
import type { IpcRenderer } from 'electron';

export function createTerminalPlatformIntegrationSampleBridge(
  ipcRenderer: IpcRenderer
): TerminalPlatformIntegrationSampleApi {
  const invoke = async <T>(channel: string, ...args: unknown[]): Promise<T> => {
    const result = (await ipcRenderer.invoke(channel, ...args)) as IpcResult<T>;
    if (!result.success) {
      throw new Error(result.error ?? 'Unknown Terminal Platform integration error');
    }
    return result.data as T;
  };

  return {
    getStatus: () => invoke<TerminalPlatformIntegrationStatus>(TERMINAL_PLATFORM_SAMPLE_GET_STATUS),
    start: () => invoke<TerminalPlatformIntegrationStatus>(TERMINAL_PLATFORM_SAMPLE_START),
    stop: () => invoke<TerminalPlatformIntegrationStatus>(TERMINAL_PLATFORM_SAMPLE_STOP),
    createNativeSession: (request?: TerminalPlatformCreateNativeSessionRequest) =>
      invoke<TerminalPlatformSessionSummary>(
        TERMINAL_PLATFORM_SAMPLE_CREATE_NATIVE_SESSION,
        request
      ),
    sendInput: (request: TerminalPlatformSendInputRequest) =>
      invoke<void>(TERMINAL_PLATFORM_SAMPLE_SEND_INPUT, request),
    screenSnapshot: (request: TerminalPlatformScreenSnapshotRequest) =>
      invoke<TerminalPlatformScreenSnapshot>(TERMINAL_PLATFORM_SAMPLE_SCREEN_SNAPSHOT, request),
  };
}
