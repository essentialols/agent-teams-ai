import type {
  TerminalPlatformCreateNativeSessionRequest,
  TerminalPlatformScreenSnapshot,
  TerminalPlatformScreenSnapshotRequest,
  TerminalPlatformSendInputRequest,
  TerminalPlatformSessionSummary,
} from '@features/terminal-platform-integration-sample/contracts';

export interface TerminalPlatformClientPort {
  handshakeInfo(): Promise<unknown>;
  createNativeSession(
    request?: TerminalPlatformCreateNativeSessionRequest
  ): Promise<TerminalPlatformSessionSummary>;
  sendInput(request: TerminalPlatformSendInputRequest): Promise<void>;
  screenSnapshot(
    request: TerminalPlatformScreenSnapshotRequest
  ): Promise<TerminalPlatformScreenSnapshot>;
  dispose(): Promise<void>;
}

export interface TerminalPlatformLoggerPort {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
