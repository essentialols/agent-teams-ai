import type { TokenUsageAnalyticsSnapshotDto, TokenUsageSnapshotRequest } from './dto';

export interface TokenUsageElectronApi {
  tokenUsage: {
    getSnapshot(request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto>;
    refreshSnapshot(request?: TokenUsageSnapshotRequest): Promise<TokenUsageAnalyticsSnapshotDto>;
    onSnapshotChanged(callback: (snapshot: TokenUsageAnalyticsSnapshotDto) => void): () => void;
  };
}
