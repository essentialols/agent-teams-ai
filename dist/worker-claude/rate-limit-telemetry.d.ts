export type ClaudeRateLimitWindowName = "five_hour" | "seven_day";
export type ClaudeRateLimitWindowSnapshot = {
    readonly usedPercentage: number;
    readonly remainingPercentage: number;
    readonly resetsAt: Date;
};
export type ClaudeRateLimitTelemetrySnapshot = {
    readonly observedAt: Date;
    readonly version?: string;
    readonly model?: string;
    readonly windows: Partial<Record<ClaudeRateLimitWindowName, ClaudeRateLimitWindowSnapshot>>;
};
export interface ClaudeRateLimitTelemetrySource {
    readonly settingsPath?: string;
    prepare?(): Promise<void>;
    latest(): ClaudeRateLimitTelemetrySnapshot | null;
}
export type FileClaudeRateLimitTelemetryOptions = {
    readonly directory: string;
};
export declare class FileClaudeRateLimitTelemetry implements ClaudeRateLimitTelemetrySource {
    readonly scriptPath: string;
    readonly settingsPath: string;
    readonly snapshotPath: string;
    constructor(options: FileClaudeRateLimitTelemetryOptions);
    prepare(): Promise<void>;
    latest(): ClaudeRateLimitTelemetrySnapshot | null;
    private directoryPath;
}
export declare function parseClaudeRateLimitTelemetry(raw: string): ClaudeRateLimitTelemetrySnapshot | null;
//# sourceMappingURL=rate-limit-telemetry.d.ts.map