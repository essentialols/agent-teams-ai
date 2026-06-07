import type {
  TerminalPlatformCreateNativeSessionRequest,
  TerminalPlatformIntegrationStatus,
  TerminalPlatformScreenSnapshot,
  TerminalPlatformScreenSnapshotRequest,
  TerminalPlatformSendInputRequest,
  TerminalPlatformSessionSummary,
} from './dto';

export interface TerminalPlatformIntegrationSampleApi {
  getStatus(): Promise<TerminalPlatformIntegrationStatus>;
  start(): Promise<TerminalPlatformIntegrationStatus>;
  stop(): Promise<TerminalPlatformIntegrationStatus>;
  createNativeSession(
    request?: TerminalPlatformCreateNativeSessionRequest
  ): Promise<TerminalPlatformSessionSummary>;
  sendInput(request: TerminalPlatformSendInputRequest): Promise<void>;
  screenSnapshot(
    request: TerminalPlatformScreenSnapshotRequest
  ): Promise<TerminalPlatformScreenSnapshot>;
}
