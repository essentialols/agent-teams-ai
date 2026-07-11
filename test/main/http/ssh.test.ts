import { registerSshRoutes } from '@main/http/ssh';
import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import type {
  SshConnectionManager,
  SshConnectionStatus,
} from '@main/services/infrastructure/SshConnectionManager';
import type { SshConfigHostEntry } from '@shared/types';

const CONNECT_UNSUPPORTED_ERROR =
  'HTTP SSH connect is not supported until context-aware route rebinding exists. Use the desktop Electron SSH controls.';
const DISCONNECT_UNSUPPORTED_ERROR =
  'HTTP SSH disconnect is not supported until context-aware route rebinding exists. Use the desktop Electron SSH controls.';

function createSshManagerMock() {
  const status: SshConnectionStatus = {
    state: 'disconnected',
    host: null,
    error: null,
    remoteProjectsPath: null,
  };
  const configHosts: SshConfigHostEntry[] = [
    {
      alias: 'dev-box',
      hostName: 'dev.example.test',
      user: 'tester',
      port: 2222,
      hasIdentityFile: true,
    },
  ];

  return {
    connect: vi.fn(async () => undefined),
    disconnect: vi.fn(),
    getStatus: vi.fn(() => status),
    testConnection: vi.fn(async () => ({ success: true })),
    getConfigHosts: vi.fn(async () => configHosts),
    resolveHostConfig: vi.fn(async (alias: string) => ({
      alias,
      hostName: 'resolved.example.test',
      hasIdentityFile: false,
    })),
  } as unknown as SshConnectionManager;
}

async function createApp() {
  const app = Fastify();
  const connectionManager = createSshManagerMock();
  const modeSwitchCallback = vi.fn(async () => undefined);
  registerSshRoutes(app, connectionManager, modeSwitchCallback);
  await app.ready();

  return { app, connectionManager, modeSwitchCallback };
}

describe('HTTP SSH routes', () => {
  it('returns 501 for connect without opening SSH or switching modes', async () => {
    const { app, connectionManager, modeSwitchCallback } = await createApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ssh/connect',
        payload: {
          host: 'dev.example.test',
          port: 22,
          username: 'tester',
          authMethod: 'password',
          password: 'secret',
        },
      });

      expect(response.statusCode).toBe(501);
      expect(response.json()).toEqual({
        success: false,
        error: CONNECT_UNSUPPORTED_ERROR,
      });
      expect(connectionManager.connect).not.toHaveBeenCalled();
      expect(connectionManager.getStatus).not.toHaveBeenCalled();
      expect(modeSwitchCallback).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('returns 501 for disconnect without closing SSH or switching modes', async () => {
    const { app, connectionManager, modeSwitchCallback } = await createApp();

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ssh/disconnect',
      });

      expect(response.statusCode).toBe(501);
      expect(response.json()).toEqual({
        success: false,
        error: DISCONNECT_UNSUPPORTED_ERROR,
      });
      expect(connectionManager.disconnect).not.toHaveBeenCalled();
      expect(connectionManager.getStatus).not.toHaveBeenCalled();
      expect(modeSwitchCallback).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('keeps read-only SSH HTTP routes wired to the connection manager', async () => {
    const { app, connectionManager, modeSwitchCallback } = await createApp();

    try {
      const stateResponse = await app.inject({
        method: 'GET',
        url: '/api/ssh/state',
      });
      expect(stateResponse.statusCode).toBe(200);
      expect(stateResponse.json()).toEqual({
        state: 'disconnected',
        host: null,
        error: null,
        remoteProjectsPath: null,
      });
      expect(connectionManager.getStatus).toHaveBeenCalledTimes(1);

      const hostsResponse = await app.inject({
        method: 'GET',
        url: '/api/ssh/config-hosts',
      });
      expect(hostsResponse.statusCode).toBe(200);
      expect(hostsResponse.json()).toEqual({
        success: true,
        data: [
          {
            alias: 'dev-box',
            hostName: 'dev.example.test',
            user: 'tester',
            port: 2222,
            hasIdentityFile: true,
          },
        ],
      });
      expect(connectionManager.getConfigHosts).toHaveBeenCalledTimes(1);

      const resolveResponse = await app.inject({
        method: 'POST',
        url: '/api/ssh/resolve-host',
        payload: { alias: 'dev-box' },
      });
      expect(resolveResponse.statusCode).toBe(200);
      expect(resolveResponse.json()).toEqual({
        success: true,
        data: {
          alias: 'dev-box',
          hostName: 'resolved.example.test',
          hasIdentityFile: false,
        },
      });
      expect(connectionManager.resolveHostConfig).toHaveBeenCalledWith('dev-box');
      expect(modeSwitchCallback).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
