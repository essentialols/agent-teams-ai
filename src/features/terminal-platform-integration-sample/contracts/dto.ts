export type TerminalPlatformRuntimeAddressKind =
  | 'runtime_slug'
  | 'filesystem_path'
  | 'namespaced_address';

export interface TerminalPlatformRuntimeAddress {
  kind: TerminalPlatformRuntimeAddressKind;
  value: string;
}

export interface TerminalPlatformIntegrationConfigInput {
  enabled?: boolean;
  runtimeSlug?: string | null;
  socketPath?: string | null;
  namespacedAddress?: string | null;
  daemonBinaryPath?: string | null;
  sessionStorePath?: string | null;
  nodePackageName?: string | null;
  autoStartSidecar?: boolean;
  allowedBackends?: string[];
}

export interface TerminalPlatformIntegrationConfig {
  enabled: boolean;
  address: TerminalPlatformRuntimeAddress;
  daemonBinaryPath: string | null;
  sessionStorePath: string | null;
  nodePackageName: string;
  autoStartSidecar: boolean;
  allowedBackends: string[];
}

export interface TerminalPlatformRedactedConfig {
  enabled: boolean;
  addressKind: TerminalPlatformRuntimeAddressKind;
  addressLabel: string;
  daemonBinaryConfigured: boolean;
  sessionStoreConfigured: boolean;
  nodePackageName: string;
  autoStartSidecar: boolean;
  allowedBackends: string[];
}

export type TerminalPlatformIntegrationPhase =
  | 'disabled'
  | 'stopped'
  | 'starting'
  | 'ready'
  | 'sdk_missing'
  | 'degraded'
  | 'error';

export interface TerminalPlatformSidecarSnapshot {
  running: boolean;
  pid: number | null;
  startedAtMs: number | null;
  exitCode: number | null;
  signal: string | null;
}

export interface TerminalPlatformIntegrationStatus {
  phase: TerminalPlatformIntegrationPhase;
  config: TerminalPlatformRedactedConfig;
  sdkLoaded: boolean;
  sidecar: TerminalPlatformSidecarSnapshot;
  handshake: unknown | null;
  lastError: string | null;
  updatedAtMs: number;
}

export interface TerminalPlatformCreateNativeSessionRequest {
  title?: string | null;
  cwd?: string | null;
  shell?: string | null;
  args?: string[];
}

export interface TerminalPlatformSessionSummary {
  sessionId: string;
  title: string | null;
  focusedPaneId: string | null;
}

export interface TerminalPlatformSendInputRequest {
  sessionId: string;
  paneId: string;
  data: string;
}

export interface TerminalPlatformScreenSnapshotRequest {
  sessionId: string;
  paneId: string;
}

export interface TerminalPlatformScreenSnapshot {
  paneId: string;
  sequence: number;
  rows: number;
  cols: number;
  source: string | null;
  lines: string[];
}
