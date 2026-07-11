/**
 * HTTP route handlers for SSH Connection Management.
 *
 * Routes:
 * - POST /api/ssh/connect - Unsupported over HTTP until route rebinding is context-aware
 * - POST /api/ssh/disconnect - Unsupported over HTTP until route rebinding is context-aware
 * - GET /api/ssh/state - Get connection state
 * - POST /api/ssh/test - Test connection
 * - GET /api/ssh/config-hosts - Get SSH config hosts
 * - POST /api/ssh/resolve-host - Resolve host config
 * - POST /api/ssh/save-last-connection - Save last connection
 * - GET /api/ssh/last-connection - Get last connection
 */

import { createLogger } from '@shared/utils/logger';

import { ConfigManager } from '../services/infrastructure/ConfigManager';

import type {
  SshConnectionConfig,
  SshConnectionManager,
} from '../services/infrastructure/SshConnectionManager';
import type { SshLastConnection } from '@shared/types';
import type { FastifyInstance } from 'fastify';

const logger = createLogger('HTTP:ssh');
const HTTP_SSH_CONNECT_UNSUPPORTED_ERROR =
  'HTTP SSH connect is not supported until context-aware route rebinding exists. Use the desktop Electron SSH controls.';
const HTTP_SSH_DISCONNECT_UNSUPPORTED_ERROR =
  'HTTP SSH disconnect is not supported until context-aware route rebinding exists. Use the desktop Electron SSH controls.';

export function registerSshRoutes(
  app: FastifyInstance,
  connectionManager: SshConnectionManager,
  _modeSwitchCallback: (mode: 'local' | 'ssh') => Promise<void>
): void {
  const configManager = ConfigManager.getInstance();

  // Connect
  app.post<{ Body: SshConnectionConfig }>('/api/ssh/connect', async (_request, reply) => {
    return reply.status(501).send({
      success: false,
      error: HTTP_SSH_CONNECT_UNSUPPORTED_ERROR,
    });
  });

  // Disconnect
  app.post('/api/ssh/disconnect', async (_request, reply) => {
    return reply.status(501).send({
      success: false,
      error: HTTP_SSH_DISCONNECT_UNSUPPORTED_ERROR,
    });
  });

  // Get state
  app.get('/api/ssh/state', async () => {
    return connectionManager.getStatus();
  });

  // Test connection
  app.post<{ Body: SshConnectionConfig }>('/api/ssh/test', async (request) => {
    try {
      const result = await connectionManager.testConnection(request.body);
      return { success: true, data: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  });

  // Get config hosts
  app.get('/api/ssh/config-hosts', async () => {
    try {
      const hosts = await connectionManager.getConfigHosts();
      return { success: true, data: hosts };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to get SSH config hosts:', message);
      return { success: true, data: [] };
    }
  });

  // Resolve host
  app.post<{ Body: { alias: string } }>('/api/ssh/resolve-host', async (request) => {
    try {
      const entry = await connectionManager.resolveHostConfig(request.body.alias);
      return { success: true, data: entry };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to resolve SSH host "${request.body.alias}":`, message);
      return { success: true, data: null };
    }
  });

  // Save last connection
  app.post<{ Body: SshLastConnection }>('/api/ssh/save-last-connection', async (request) => {
    try {
      const config = request.body;
      configManager.updateConfig('ssh', {
        lastConnection: {
          host: config.host,
          port: config.port,
          username: config.username,
          authMethod: config.authMethod,
          privateKeyPath: config.privateKeyPath,
        },
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to save SSH connection:', message);
      return { success: false, error: message };
    }
  });

  // Get last connection
  app.get('/api/ssh/last-connection', async () => {
    try {
      const config = configManager.getConfig();
      return { success: true, data: config.ssh.lastConnection };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Failed to get last SSH connection:', message);
      return { success: true, data: null };
    }
  });
}
