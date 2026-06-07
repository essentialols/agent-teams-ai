import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

import type { TerminalPlatformLoggerPort } from '../../core/application/ports';
import type {
  TerminalPlatformIntegrationConfig,
  TerminalPlatformSidecarSnapshot,
} from '@features/terminal-platform-integration-sample/contracts';

const SIDECAR_READY_TIMEOUT_MS = 5000;

export class TerminalPlatformSidecarSupervisor {
  private child: ChildProcessWithoutNullStreams | null = null;
  private startedAtMs: number | null = null;
  private exitCode: number | null = null;
  private signal: string | null = null;

  constructor(
    private readonly config: TerminalPlatformIntegrationConfig,
    private readonly logger: TerminalPlatformLoggerPort
  ) {}

  snapshot(): TerminalPlatformSidecarSnapshot {
    return {
      running: this.child !== null,
      pid: this.child?.pid ?? null,
      startedAtMs: this.startedAtMs,
      exitCode: this.exitCode,
      signal: this.signal,
    };
  }

  async start(): Promise<TerminalPlatformSidecarSnapshot> {
    if (this.child) {
      return this.snapshot();
    }

    if (!this.config.daemonBinaryPath) {
      throw new Error('Terminal Platform daemon binary path is not configured');
    }
    if (!existsSync(this.config.daemonBinaryPath)) {
      throw new Error('Terminal Platform daemon binary does not exist');
    }

    const args = buildTerminalPlatformDaemonArgs(this.config);
    const child = spawn(this.config.daemonBinaryPath, args, {
      env: buildTerminalPlatformDaemonEnv(process.env, this.config),
      stdio: 'pipe',
      windowsHide: true,
    });
    const ready = new Promise<void>((resolve, reject) => {
      let settled = false;
      let timeout: NodeJS.Timeout | null = null;
      const finish = (error?: Error): void => {
        if (settled) {
          return;
        }
        settled = true;
        if (timeout) {
          clearTimeout(timeout);
        }
        child.off('error', onError);
        child.off('exit', onExitBeforeReady);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };
      const onError = (error: Error): void => {
        finish(error);
      };
      const onExitBeforeReady = (exitCode: number | null, signal: NodeJS.Signals | null): void => {
        finish(
          new Error(
            `Terminal Platform daemon exited before readiness with code ${exitCode ?? 'null'} and signal ${
              signal ?? 'null'
            }`
          )
        );
      };
      const markReady = (): void => {
        finish();
      };

      timeout = setTimeout(() => {
        finish(new Error('Terminal Platform daemon did not report readiness before timeout'));
      }, SIDECAR_READY_TIMEOUT_MS);
      child.once('error', onError);
      child.once('exit', onExitBeforeReady);
      child.stdout.on('data', (chunk) => {
        const text = String(chunk).trim();
        this.logger.info(`terminal-platform stdout: ${text}`);
        if (text.includes('terminal-daemon listening on')) {
          markReady();
        }
      });
    });
    child.stderr.on('data', (chunk) => {
      this.logger.warn(`terminal-platform stderr: ${String(chunk).trim()}`);
    });
    child.on('exit', (exitCode, signal) => {
      this.exitCode = exitCode;
      this.signal = signal;
      this.child = null;
      this.logger.warn(
        `Terminal Platform daemon exited with code ${exitCode ?? 'null'} and signal ${
          signal ?? 'null'
        }`
      );
    });

    this.child = child;
    this.startedAtMs = Date.now();
    this.exitCode = null;
    this.signal = null;
    this.logger.info(`Terminal Platform daemon started with pid ${child.pid ?? 'unknown'}`);
    await ready;
    return this.snapshot();
  }

  async stop(): Promise<TerminalPlatformSidecarSnapshot> {
    const child = this.child;
    if (!child) {
      return this.snapshot();
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
        resolve();
      }, 2500);

      child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      child.kill('SIGTERM');
    });

    this.child = null;
    return this.snapshot();
  }
}

export function buildTerminalPlatformDaemonArgs(
  config: TerminalPlatformIntegrationConfig
): string[] {
  const args: string[] = [];

  if (config.address.kind === 'runtime_slug') {
    args.push('--runtime-slug', config.address.value);
  } else if (config.address.kind === 'filesystem_path') {
    args.push('--socket-path', config.address.value);
  }

  if (config.sessionStorePath) {
    args.push('--session-store', config.sessionStorePath);
  }

  return args;
}

function buildTerminalPlatformDaemonEnv(
  env: NodeJS.ProcessEnv,
  config: TerminalPlatformIntegrationConfig
): NodeJS.ProcessEnv {
  return {
    ...env,
    TERMINAL_DAEMON_BACKENDS: config.allowedBackends.join(','),
  };
}
