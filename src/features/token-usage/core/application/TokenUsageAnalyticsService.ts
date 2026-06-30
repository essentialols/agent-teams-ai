import { buildTokenUsageSnapshot } from '../domain';

import type {
  TokenUsageAnalyticsSnapshotDto,
  TokenUsageEventDto,
  TokenUsageRunDto,
  TokenUsageSnapshotRequest,
} from '../../contracts';
import type {
  TokenUsageAnalyticsServicePort,
  TokenUsageClockPort,
  TokenUsageImporterPort,
  TokenUsageLedgerRepositoryPort,
  TokenUsageLoggerPort,
  TokenUsageRealtimePublisherPort,
  TokenUsageRunSourceDiscoveryPort,
} from './ports';

export interface TokenUsageAnalyticsServiceDeps {
  ledger: TokenUsageLedgerRepositoryPort;
  discovery: TokenUsageRunSourceDiscoveryPort;
  importers: readonly TokenUsageImporterPort[];
  clock: TokenUsageClockPort;
  publisher?: TokenUsageRealtimePublisherPort;
  logger?: TokenUsageLoggerPort;
}

export class TokenUsageAnalyticsService implements TokenUsageAnalyticsServicePort {
  constructor(private readonly deps: TokenUsageAnalyticsServiceDeps) {}

  async getSnapshot(request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto> {
    const [runs, events] = await Promise.all([
      this.deps.ledger.listRuns(),
      this.deps.ledger.listEvents(),
    ]);
    return buildTokenUsageSnapshot({
      runs,
      events,
      request,
      nowIso: this.deps.clock.now().toISOString(),
    });
  }

  async refreshSnapshot(
    request?: TokenUsageSnapshotRequest
  ): Promise<TokenUsageAnalyticsSnapshotDto> {
    let degraded = false;
    try {
      const discoveredRuns = await this.deps.discovery.discoverAppRuns();
      await this.deps.ledger.replaceRunsForSource('team_launch_state', discoveredRuns);
    } catch (error) {
      degraded = true;
      this.deps.logger?.warn('Failed to discover token usage app runs', error);
    }

    const runs = await this.deps.ledger.listRuns();
    for (const importer of this.deps.importers) {
      try {
        const events = await importer.importUsage(runs);
        await this.deps.ledger.upsertEvents(events);
      } catch (error) {
        degraded = true;
        this.deps.logger?.warn('Failed to import token usage events', error);
      }
    }

    const snapshot = buildTokenUsageSnapshot({
      runs: await this.deps.ledger.listRuns(),
      events: await this.deps.ledger.listEvents(),
      request,
      nowIso: this.deps.clock.now().toISOString(),
      degraded,
    });
    this.deps.publisher?.publishSnapshot(snapshot);
    return snapshot;
  }

  async recordRuns(runs: readonly TokenUsageRunDto[]): Promise<void> {
    await this.deps.ledger.upsertRuns(runs);
    await this.publishCurrentSnapshot();
  }

  async ingestEvents(events: readonly TokenUsageEventDto[]): Promise<void> {
    await this.deps.ledger.upsertEvents(events);
    await this.publishCurrentSnapshot();
  }

  private async publishCurrentSnapshot(): Promise<void> {
    if (!this.deps.publisher) return;
    const [runs, events] = await Promise.all([
      this.deps.ledger.listRuns(),
      this.deps.ledger.listEvents(),
    ]);
    this.deps.publisher.publishSnapshot(
      buildTokenUsageSnapshot({
        runs,
        events,
        nowIso: this.deps.clock.now().toISOString(),
      })
    );
  }
}
