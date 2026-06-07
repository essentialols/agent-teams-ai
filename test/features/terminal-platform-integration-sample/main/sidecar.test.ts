import { normalizeTerminalPlatformIntegrationConfig } from '@features/terminal-platform-integration-sample/core/domain/config';
import { buildTerminalPlatformDaemonArgs } from '@features/terminal-platform-integration-sample/main';
import { describe, expect, it } from 'vitest';

describe('terminal platform sidecar args', () => {
  it('uses runtime slug and session store for the managed sidecar', () => {
    const config = normalizeTerminalPlatformIntegrationConfig({
      enabled: true,
      runtimeSlug: 'agent-teams-prod',
      sessionStorePath: '/tmp/history.sqlite3',
    });

    expect(buildTerminalPlatformDaemonArgs(config)).toEqual([
      '--runtime-slug',
      'agent-teams-prod',
      '--session-store',
      '/tmp/history.sqlite3',
    ]);
  });

  it('uses filesystem socket when configured', () => {
    const config = normalizeTerminalPlatformIntegrationConfig({
      enabled: true,
      socketPath: '/tmp/agent-teams-terminal.sock',
    });

    expect(buildTerminalPlatformDaemonArgs(config)).toEqual([
      '--socket-path',
      '/tmp/agent-teams-terminal.sock',
    ]);
  });
});
