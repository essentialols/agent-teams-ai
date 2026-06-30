import type {
  TokenUsageAnalyticsSnapshotDto,
  TokenUsageEventDto,
  TokenUsageRunDto,
  TokenUsageSnapshotRequest,
} from '../../contracts';

export interface TokenUsageLedgerRepositoryPort {
  listRuns(): Promise<TokenUsageRunDto[]>;
  listEvents(): Promise<TokenUsageEventDto[]>;
  upsertRuns(runs: readonly TokenUsageRunDto[]): Promise<void>;
  replaceRunsForSource(
    source: TokenUsageRunDto['source'],
    runs: readonly TokenUsageRunDto[]
  ): Promise<void>;
  upsertEvents(events: readonly TokenUsageEventDto[]): Promise<void>;
}

export interface TokenUsageRunSourceDiscoveryPort {
  discoverAppRuns(): Promise<TokenUsageRunDto[]>;
}

export interface TokenUsageImporterPort {
  importUsage(runs: readonly TokenUsageRunDto[]): Promise<TokenUsageEventDto[]>;
}

export interface TokenUsageRealtimePublisherPort {
  publishSnapshot(snapshot: TokenUsageAnalyticsSnapshotDto): void;
}

export interface TokenUsageClockPort {
  now(): Date;
}

export interface TokenUsageLoggerPort {
  warn(message: string, meta?: unknown): void;
  error(message: string, error?: unknown): void;
}

export interface TokenUsageAnalyticsServicePort {
  getSnapshot(request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto>;
  refreshSnapshot(request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto>;
  recordRuns(runs: readonly TokenUsageRunDto[]): Promise<void>;
  ingestEvents(events: readonly TokenUsageEventDto[]): Promise<void>;
}
