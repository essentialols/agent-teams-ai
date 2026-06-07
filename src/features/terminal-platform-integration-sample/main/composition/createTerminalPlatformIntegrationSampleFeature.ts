import {
  redactTerminalPlatformConfig,
  terminalPlatformConfigFromEnv,
} from '../../core/domain/config';
import { createTerminalPlatformNodeClient } from '../infrastructure/TerminalPlatformNodeClientAdapter';
import { TerminalPlatformSidecarSupervisor } from '../infrastructure/TerminalPlatformSidecarSupervisor';

import type {
  TerminalPlatformClientPort,
  TerminalPlatformLoggerPort,
} from '../../core/application/ports';
import type {
  TerminalPlatformCreateNativeSessionRequest,
  TerminalPlatformIntegrationConfig,
  TerminalPlatformIntegrationStatus,
  TerminalPlatformScreenSnapshot,
  TerminalPlatformScreenSnapshotRequest,
  TerminalPlatformSendInputRequest,
  TerminalPlatformSessionSummary,
} from '@features/terminal-platform-integration-sample/contracts';

export interface TerminalPlatformIntegrationSampleFeatureOptions {
  clientFactory?: (
    config: TerminalPlatformIntegrationConfig
  ) => Promise<TerminalPlatformClientPort>;
  env?: Record<string, string | undefined>;
  logger: TerminalPlatformLoggerPort;
}

export interface TerminalPlatformIntegrationSampleFeatureFacade {
  getStatus(): TerminalPlatformIntegrationStatus;
  start(): Promise<TerminalPlatformIntegrationStatus>;
  stop(): Promise<TerminalPlatformIntegrationStatus>;
  createNativeSession(
    request?: TerminalPlatformCreateNativeSessionRequest
  ): Promise<TerminalPlatformSessionSummary>;
  sendInput(request: TerminalPlatformSendInputRequest): Promise<void>;
  screenSnapshot(
    request: TerminalPlatformScreenSnapshotRequest
  ): Promise<TerminalPlatformScreenSnapshot>;
  dispose(): Promise<void>;
}

export function createTerminalPlatformIntegrationSampleFeature(
  options: TerminalPlatformIntegrationSampleFeatureOptions
): TerminalPlatformIntegrationSampleFeatureFacade {
  const config = terminalPlatformConfigFromEnv(options.env ?? process.env);
  return new TerminalPlatformIntegrationSampleFeature(
    config,
    options.logger,
    options.clientFactory ?? createTerminalPlatformNodeClient
  );
}

class TerminalPlatformIntegrationSampleFeature implements TerminalPlatformIntegrationSampleFeatureFacade {
  private readonly sidecar: TerminalPlatformSidecarSupervisor;
  private client: TerminalPlatformClientPort | null = null;
  private handshake: unknown | null = null;
  private phase: TerminalPlatformIntegrationStatus['phase'];
  private lastError: string | null = null;

  constructor(
    private readonly config: TerminalPlatformIntegrationConfig,
    private readonly logger: TerminalPlatformLoggerPort,
    private readonly clientFactory: (
      config: TerminalPlatformIntegrationConfig
    ) => Promise<TerminalPlatformClientPort>
  ) {
    this.phase = config.enabled ? 'stopped' : 'disabled';
    this.sidecar = new TerminalPlatformSidecarSupervisor(config, logger);
  }

  getStatus(): TerminalPlatformIntegrationStatus {
    return {
      phase: this.phase,
      config: redactTerminalPlatformConfig(this.config),
      sdkLoaded: this.client !== null,
      sidecar: this.sidecar.snapshot(),
      handshake: this.handshake,
      lastError: this.lastError,
      updatedAtMs: Date.now(),
    };
  }

  async start(): Promise<TerminalPlatformIntegrationStatus> {
    if (!this.config.enabled) {
      return this.getStatus();
    }
    if (this.client && this.phase === 'ready') {
      return this.getStatus();
    }

    this.phase = 'starting';
    this.lastError = null;

    try {
      if (this.config.autoStartSidecar && this.config.daemonBinaryPath) {
        await this.sidecar.start();
      }

      this.client = await this.clientFactory(this.config);
      this.handshake = await this.client.handshakeInfo();
      this.phase = 'ready';
      this.logger.info('Terminal Platform integration sample is ready');
    } catch (error) {
      await this.client?.dispose().catch((disposeError: unknown) => {
        this.logger.warn(
          `Terminal Platform client cleanup failed: ${formatUnknownError(disposeError)}`
        );
      });
      this.client = null;
      this.handshake = null;
      this.lastError = error instanceof Error ? error.message : String(error);
      this.phase = this.lastError.includes('Cannot find package') ? 'sdk_missing' : 'error';
      await this.sidecar.stop().catch((stopError: unknown) => {
        this.logger.warn(
          `Terminal Platform sidecar cleanup failed: ${formatUnknownError(stopError)}`
        );
      });
      this.logger.warn(`Terminal Platform integration sample failed to start: ${this.lastError}`);
    }

    return this.getStatus();
  }

  async stop(): Promise<TerminalPlatformIntegrationStatus> {
    await this.client?.dispose();
    this.client = null;
    this.handshake = null;
    await this.sidecar.stop();
    this.phase = this.config.enabled ? 'stopped' : 'disabled';
    return this.getStatus();
  }

  async createNativeSession(
    request?: TerminalPlatformCreateNativeSessionRequest
  ): Promise<TerminalPlatformSessionSummary> {
    return this.ensureClient().createNativeSession(request);
  }

  async sendInput(request: TerminalPlatformSendInputRequest): Promise<void> {
    validateNonEmpty(request.sessionId, 'sessionId');
    validateNonEmpty(request.paneId, 'paneId');
    validateNonEmpty(request.data, 'data');
    await this.ensureClient().sendInput(request);
  }

  async screenSnapshot(
    request: TerminalPlatformScreenSnapshotRequest
  ): Promise<TerminalPlatformScreenSnapshot> {
    validateNonEmpty(request.sessionId, 'sessionId');
    validateNonEmpty(request.paneId, 'paneId');
    return this.ensureClient().screenSnapshot(request);
  }

  async dispose(): Promise<void> {
    await this.stop();
  }

  private ensureClient(): TerminalPlatformClientPort {
    if (!this.config.enabled) {
      throw new Error('Terminal Platform integration sample is disabled');
    }
    if (!this.client) {
      throw new Error('Terminal Platform integration sample is not started');
    }
    return this.client;
  }
}

function validateNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
