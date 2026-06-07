import { normalizeTerminalPlatformIntegrationConfig } from '@features/terminal-platform-integration-sample/core/domain/config';
import { createTerminalPlatformIntegrationSampleFeature } from '@features/terminal-platform-integration-sample/main';
import { createTerminalPlatformNodeClient } from '@features/terminal-platform-integration-sample/main/infrastructure/TerminalPlatformNodeClientAdapter';
import { describe, expect, it, vi } from 'vitest';

import type { TerminalPlatformClientPort } from '@features/terminal-platform-integration-sample/core/application/ports';

describe('terminal platform integration feature', () => {
  it('does not create a second SDK client when start is called twice', async () => {
    const client = createClient();
    const clientFactory = vi.fn().mockResolvedValue(client);
    const feature = createTerminalPlatformIntegrationSampleFeature({
      clientFactory,
      env: { AGENT_TEAMS_TERMINAL_PLATFORM_ENABLED: '1' },
      logger: createLogger(),
    });

    await feature.start();
    const status = await feature.start();

    expect(status.phase).toBe('ready');
    expect(clientFactory).toHaveBeenCalledTimes(1);
    expect(client.dispose).not.toHaveBeenCalled();
  });

  it('disposes a partially started SDK client when handshake fails', async () => {
    const client = createClient({
      handshakeInfo: vi.fn().mockRejectedValue(new Error('handshake failed')),
    });
    const feature = createTerminalPlatformIntegrationSampleFeature({
      clientFactory: vi.fn().mockResolvedValue(client),
      env: { AGENT_TEAMS_TERMINAL_PLATFORM_ENABLED: '1' },
      logger: createLogger(),
    });

    const status = await feature.start();

    expect(status.phase).toBe('error');
    expect(status.sdkLoaded).toBe(false);
    expect(client.dispose).toHaveBeenCalledTimes(1);
  });

  it('loads class-shaped TerminalNodeClient SDK exports', async () => {
    const client = await createTerminalPlatformNodeClient(
      normalizeTerminalPlatformIntegrationConfig({
        enabled: true,
        nodePackageName: 'terminal-platform-node',
        runtimeSlug: 'agent-teams',
      }),
      async () => ({
        TerminalNodeClient: class {
          static fromRuntimeSlug(slug: string) {
            return {
              handshakeInfo: async () => ({ slug }),
              dispose: async () => undefined,
            };
          }
        },
      })
    );

    await expect(client.handshakeInfo()).resolves.toEqual({ slug: 'agent-teams' });
  });
});

function createClient(
  overrides: Partial<TerminalPlatformClientPort> = {}
): TerminalPlatformClientPort {
  return {
    handshakeInfo: vi.fn().mockResolvedValue({ protocol: 'test' }),
    createNativeSession: vi.fn(),
    sendInput: vi.fn(),
    screenSnapshot: vi.fn(),
    dispose: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}
