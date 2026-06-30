import { TokenUsageAnalyticsService } from '../../core/application';
import { ClaudeJsonlUsageImporter } from '../infrastructure/ClaudeJsonlUsageImporter';
import { createCliUsageImporter } from '../infrastructure/CliUsageImporters';
import { CodexJsonlUsageImporter } from '../infrastructure/CodexJsonlUsageImporter';
import { JsonTokenUsageLedgerRepository } from '../infrastructure/JsonTokenUsageLedgerRepository';
import { createJsonFileUsageImporter } from '../infrastructure/JsonUsageImporters';
import { TeamLaunchRunSourceDiscovery } from '../infrastructure/TeamLaunchRunSourceDiscovery';

import type {
  TokenUsageAnalyticsSnapshotDto,
  TokenUsageEventDto,
  TokenUsageRunDto,
  TokenUsageSnapshotRequest,
} from '../../contracts';
import type {
  TokenUsageAnalyticsServicePort,
  TokenUsageImporterPort,
  TokenUsageLoggerPort,
  TokenUsageRealtimePublisherPort,
} from '../../core/application';

export interface TokenUsageFeatureFacade {
  getSnapshot(request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto>;
  refreshSnapshot(request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto>;
  recordRuns(runs: readonly TokenUsageRunDto[]): Promise<void>;
  ingestEvents(events: readonly TokenUsageEventDto[]): Promise<void>;
}

export interface CreateTokenUsageFeatureDeps {
  ledgerPath: string;
  teamsBasePath: string;
  claudeProjectsBasePath?: string;
  importers?: readonly TokenUsageImporterPort[];
  ccusageJsonPath?: string;
  tokscaleJsonPath?: string;
  ccusageCommand?: string;
  ccusageArgs?: readonly string[];
  tokscaleCommand?: string;
  tokscaleArgs?: readonly string[];
  commandImporterRefreshIntervalMs?: number;
  publisher?: TokenUsageRealtimePublisherPort;
  logger?: TokenUsageLoggerPort;
}

export function createTokenUsageFeature(
  deps: CreateTokenUsageFeatureDeps
): TokenUsageFeatureFacade {
  const service: TokenUsageAnalyticsServicePort = new TokenUsageAnalyticsService({
    ledger: new JsonTokenUsageLedgerRepository(deps.ledgerPath),
    discovery: new TeamLaunchRunSourceDiscovery(deps.teamsBasePath),
    importers: buildImporters(deps),
    clock: { now: () => new Date() },
    publisher: deps.publisher,
    logger: deps.logger,
  });

  return {
    getSnapshot: (request) => service.getSnapshot(request),
    refreshSnapshot: (request) => service.refreshSnapshot(request),
    recordRuns: (runs) => service.recordRuns(runs),
    ingestEvents: (events) => service.ingestEvents(events),
  };
}

function buildImporters(deps: CreateTokenUsageFeatureDeps): TokenUsageImporterPort[] {
  const importers = [...(deps.importers ?? [])];
  if (deps.claudeProjectsBasePath) {
    importers.push(
      new ClaudeJsonlUsageImporter({
        projectsBasePath: deps.claudeProjectsBasePath,
        enableSessionIdIndexFallback: false,
        runLookbackMs: 48 * 60 * 60 * 1000,
        logger: deps.logger,
      }),
      new CodexJsonlUsageImporter({
        projectsBasePath: deps.claudeProjectsBasePath,
        enableSessionIdIndexFallback: false,
        runLookbackMs: 48 * 60 * 60 * 1000,
        logger: deps.logger,
      })
    );
  }
  if (deps.ccusageJsonPath) {
    importers.push(createJsonFileUsageImporter('ccusage', deps.ccusageJsonPath));
  }
  if (deps.tokscaleJsonPath) {
    importers.push(createJsonFileUsageImporter('tokscale', deps.tokscaleJsonPath));
  }
  if (deps.ccusageCommand) {
    importers.push(
      createCliUsageImporter('ccusage', {
        command: deps.ccusageCommand,
        args: deps.ccusageArgs,
        minRefreshIntervalMs: deps.commandImporterRefreshIntervalMs,
      })
    );
  }
  if (deps.tokscaleCommand) {
    importers.push(
      createCliUsageImporter('tokscale', {
        command: deps.tokscaleCommand,
        args: deps.tokscaleArgs,
        minRefreshIntervalMs: deps.commandImporterRefreshIntervalMs,
      })
    );
  }
  return importers;
}
