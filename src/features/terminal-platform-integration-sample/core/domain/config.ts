import type {
  TerminalPlatformIntegrationConfig,
  TerminalPlatformIntegrationConfigInput,
  TerminalPlatformRedactedConfig,
  TerminalPlatformRuntimeAddress,
} from '@features/terminal-platform-integration-sample/contracts';

const DEFAULT_RUNTIME_SLUG = 'agent-teams';
const DEFAULT_NODE_PACKAGE_NAME = 'terminal-platform-node';
const DEFAULT_ALLOWED_BACKENDS = ['native', 'zellij'];

export function normalizeTerminalPlatformIntegrationConfig(
  input: TerminalPlatformIntegrationConfigInput = {}
): TerminalPlatformIntegrationConfig {
  return {
    enabled: input.enabled === true,
    address: resolveRuntimeAddress(input),
    daemonBinaryPath: normalizeOptionalString(input.daemonBinaryPath),
    sessionStorePath: normalizeOptionalString(input.sessionStorePath),
    nodePackageName: normalizeOptionalString(input.nodePackageName) ?? DEFAULT_NODE_PACKAGE_NAME,
    autoStartSidecar: input.autoStartSidecar === true,
    allowedBackends: normalizeAllowedBackends(input.allowedBackends),
  };
}

export function terminalPlatformConfigFromEnv(
  env: Record<string, string | undefined>
): TerminalPlatformIntegrationConfig {
  return normalizeTerminalPlatformIntegrationConfig({
    enabled: readBooleanEnv(env.AGENT_TEAMS_TERMINAL_PLATFORM_ENABLED),
    runtimeSlug: env.TERMINAL_PLATFORM_RUNTIME_SLUG,
    socketPath: env.TERMINAL_PLATFORM_SOCKET_PATH,
    namespacedAddress: env.TERMINAL_PLATFORM_NAMESPACED_ADDRESS,
    daemonBinaryPath: env.TERMINAL_PLATFORM_DAEMON_PATH,
    sessionStorePath: env.TERMINAL_PLATFORM_SESSION_STORE,
    nodePackageName: env.TERMINAL_PLATFORM_NODE_PACKAGE,
    autoStartSidecar: readBooleanEnv(env.TERMINAL_PLATFORM_AUTO_START),
    allowedBackends: splitCsv(env.TERMINAL_PLATFORM_BACKENDS),
  });
}

export function redactTerminalPlatformConfig(
  config: TerminalPlatformIntegrationConfig
): TerminalPlatformRedactedConfig {
  return {
    enabled: config.enabled,
    addressKind: config.address.kind,
    addressLabel: redactAddress(config.address),
    daemonBinaryConfigured: config.daemonBinaryPath !== null,
    sessionStoreConfigured: config.sessionStorePath !== null,
    nodePackageName: config.nodePackageName,
    autoStartSidecar: config.autoStartSidecar,
    allowedBackends: [...config.allowedBackends],
  };
}

function resolveRuntimeAddress(
  input: TerminalPlatformIntegrationConfigInput
): TerminalPlatformRuntimeAddress {
  const socketPath = normalizeOptionalString(input.socketPath);
  if (socketPath) {
    return { kind: 'filesystem_path', value: socketPath };
  }

  const namespacedAddress = normalizeOptionalString(input.namespacedAddress);
  if (namespacedAddress) {
    return { kind: 'namespaced_address', value: namespacedAddress };
  }

  return {
    kind: 'runtime_slug',
    value: normalizeOptionalString(input.runtimeSlug) ?? DEFAULT_RUNTIME_SLUG,
  };
}

function normalizeAllowedBackends(values: string[] | undefined): string[] {
  const normalized = (values ?? DEFAULT_ALLOWED_BACKENDS)
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBooleanEnv(value: string | undefined): boolean {
  return value === '1' || value?.toLowerCase() === 'true';
}

function splitCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value.split(',').map((entry) => entry.trim());
}

function redactAddress(address: TerminalPlatformRuntimeAddress): string {
  if (address.kind === 'runtime_slug') {
    return address.value;
  }

  const visibleTail = address.value.split(/[\\/]/).filter(Boolean).at(-1) ?? 'configured';
  return `.../${visibleTail}`;
}
