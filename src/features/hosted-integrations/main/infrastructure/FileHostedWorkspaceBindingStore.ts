import { mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { atomicWriteAsync } from '@main/utils/atomicWrite';

import type {
  HostedGitHubActionStatusDto,
  HostedGitHubConnectionDto,
  HostedGitHubRepositoryTargetDto,
  HostedGitHubSetupSessionDto,
  HostedIntegrationDesktopSessionDto,
  HostedIntegrationStateDto,
} from '../../contracts';
import type { HostedWorkspaceBindingStorePort } from '../../core/application';
import type { NormalizedControlPlaneBaseUrl } from '../../core/domain';

const CONTRACT_VERSION = 'desktop-hosted-integrations-v1';
const RECENT_ACTION_LIMIT = 20;

interface PersistedHostedIntegrationState {
  readonly controlPlaneBaseUrl?: string;
  readonly session?: HostedIntegrationDesktopSessionDto;
  readonly activeSetup?: HostedGitHubSetupSessionDto;
  readonly connections?: readonly HostedGitHubConnectionDto[];
  readonly targets?: readonly HostedGitHubRepositoryTargetDto[];
  readonly recentActions?: readonly HostedGitHubActionStatusDto[];
}

export class FileHostedWorkspaceBindingStore implements HostedWorkspaceBindingStorePort {
  public constructor(private readonly filePath: string) {}

  public async readState(): Promise<HostedIntegrationStateDto> {
    const persisted = await this.readPersisted();
    return this.toDto(persisted);
  }

  public async saveControlPlaneBaseUrl(baseUrl: NormalizedControlPlaneBaseUrl): Promise<void> {
    const persisted = await this.readPersisted();
    await this.writePersisted({
      ...persisted,
      controlPlaneBaseUrl: baseUrl.href,
    });
  }

  public async saveSession(session: HostedIntegrationDesktopSessionDto): Promise<void> {
    const persisted = await this.readPersisted();
    await this.writePersisted({
      ...persisted,
      session,
    });
  }

  public async saveSetupSession(setup: HostedGitHubSetupSessionDto | null): Promise<void> {
    const persisted = await this.readPersisted();
    const next = { ...persisted };
    if (setup) {
      next.activeSetup = setup;
    } else {
      delete next.activeSetup;
    }
    await this.writePersisted(next);
  }

  public async saveConnections(connections: readonly HostedGitHubConnectionDto[]): Promise<void> {
    const persisted = await this.readPersisted();
    await this.writePersisted({
      ...persisted,
      connections,
    });
  }

  public async saveTargets(targets: readonly HostedGitHubRepositoryTargetDto[]): Promise<void> {
    const persisted = await this.readPersisted();
    await this.writePersisted({
      ...persisted,
      targets,
    });
  }

  public async saveActionStatus(status: HostedGitHubActionStatusDto): Promise<void> {
    const persisted = await this.readPersisted();
    const existing = persisted.recentActions ?? [];
    const next = [
      status,
      ...existing.filter((item) => item.actionRequestId !== status.actionRequestId),
    ].slice(0, RECENT_ACTION_LIMIT);
    await this.writePersisted({
      ...persisted,
      recentActions: next,
    });
  }

  public async markSessionRevoked(): Promise<HostedIntegrationDesktopSessionDto | null> {
    const persisted = await this.readPersisted();
    if (!persisted.session) {
      return null;
    }
    const revoked: HostedIntegrationDesktopSessionDto = {
      ...persisted.session,
      state: 'revoked',
      fetchedAt: new Date().toISOString(),
    };
    await this.writePersisted({
      ...persisted,
      activeSetup: undefined,
      session: revoked,
    });
    return revoked;
  }

  private async readPersisted(): Promise<PersistedHostedIntegrationState> {
    try {
      const text = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(text) as unknown;
      if (isRecord(parsed)) {
        return parsed as PersistedHostedIntegrationState;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    return {};
  }

  private async writePersisted(state: PersistedHostedIntegrationState): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await atomicWriteAsync(this.filePath, `${JSON.stringify(removeUndefined(state), null, 2)}\n`);
  }

  private toDto(persisted: PersistedHostedIntegrationState): HostedIntegrationStateDto {
    const fetchedAt = new Date().toISOString();
    return {
      availability: {
        contractVersion: CONTRACT_VERSION,
        status: persisted.controlPlaneBaseUrl ? 'available' : 'not_configured',
      },
      ...(persisted.controlPlaneBaseUrl
        ? { controlPlaneBaseUrl: persisted.controlPlaneBaseUrl }
        : {}),
      ...(persisted.session ? { session: persisted.session } : {}),
      ...(persisted.activeSetup ? { activeSetup: persisted.activeSetup } : {}),
      connections: persisted.connections ?? [],
      targets: persisted.targets ?? [],
      recentActions: persisted.recentActions ?? [],
      fetchedAt,
    };
  }
}

function removeUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, removeUndefined(entry)])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
