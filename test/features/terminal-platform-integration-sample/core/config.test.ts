import {
  normalizeTerminalPlatformIntegrationConfig,
  redactTerminalPlatformConfig,
  terminalPlatformConfigFromEnv,
} from '@features/terminal-platform-integration-sample/core/domain/config';
import { describe, expect, it } from 'vitest';

describe('terminal platform integration config', () => {
  it('defaults to a disabled agent-teams runtime slug', () => {
    const config = normalizeTerminalPlatformIntegrationConfig();

    expect(config.enabled).toBe(false);
    expect(config.address).toEqual({ kind: 'runtime_slug', value: 'agent-teams' });
    expect(config.nodePackageName).toBe('terminal-platform-node');
    expect(config.allowedBackends).toEqual(['native', 'zellij']);
  });

  it('prefers explicit filesystem socket paths over runtime slugs', () => {
    const config = normalizeTerminalPlatformIntegrationConfig({
      enabled: true,
      runtimeSlug: 'ignored',
      socketPath: '/tmp/terminal-platform.sock',
      allowedBackends: ['native', 'native', ' zellij '],
    });

    expect(config.address).toEqual({
      kind: 'filesystem_path',
      value: '/tmp/terminal-platform.sock',
    });
    expect(config.allowedBackends).toEqual(['native', 'zellij']);
  });

  it('reads production env without leaking socket paths in redacted status', () => {
    const config = terminalPlatformConfigFromEnv({
      AGENT_TEAMS_TERMINAL_PLATFORM_ENABLED: '1',
      TERMINAL_PLATFORM_SOCKET_PATH: '/Users/example/private/runtime.sock',
      TERMINAL_PLATFORM_AUTO_START: 'true',
      TERMINAL_PLATFORM_DAEMON_PATH: '/opt/terminal-platform/terminal-daemon',
      TERMINAL_PLATFORM_SESSION_STORE: '/Users/example/private/history.sqlite3',
    });

    expect(config.enabled).toBe(true);
    expect(redactTerminalPlatformConfig(config)).toMatchObject({
      addressKind: 'filesystem_path',
      addressLabel: '.../runtime.sock',
      daemonBinaryConfigured: true,
      sessionStoreConfigured: true,
      autoStartSidecar: true,
    });
  });
});
