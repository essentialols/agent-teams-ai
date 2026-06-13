export type ClaudeLogicalThreadState = {
    readonly threadId: string;
    readonly cwd: string;
    readonly generation: number;
    readonly latestSessionId?: string;
    readonly latestBundleId?: string;
    readonly latestProviderInstanceId?: string;
    readonly latestWorkerId?: string;
    readonly updatedAt: string;
};
export interface ClaudeLogicalThreadStore {
    read(threadId: string): Promise<ClaudeLogicalThreadState | null>;
    compareAndSwap(input: {
        readonly threadId: string;
        readonly expectedGeneration: number;
        readonly next: Omit<ClaudeLogicalThreadState, "generation">;
    }): Promise<ClaudeLogicalThreadState>;
    updateExclusive<T>(input: {
        readonly threadId: string;
        readonly update: (current: ClaudeLogicalThreadState | null) => Promise<{
            readonly next: Omit<ClaudeLogicalThreadState, "generation">;
            readonly value: T;
        }>;
    }): Promise<{
        readonly state: ClaudeLogicalThreadState;
        readonly value: T;
    }>;
}
export type ClaudeTranscriptBundle = {
    readonly bundleId: string;
    readonly cwd: string;
    readonly sessionId: string;
    readonly sourceConfigDir: string;
    readonly files: readonly string[];
    readonly capturedAt: string;
};
export interface ClaudeTranscriptBundleStore {
    capture(input: {
        readonly sourceConfigDir: string;
        readonly cwd: string;
        readonly sessionId: string;
    }): Promise<ClaudeTranscriptBundle>;
    materialize(input: {
        readonly bundleId: string;
        readonly targetConfigDir: string;
    }): Promise<ClaudeTranscriptBundle>;
    remove?(input: {
        readonly bundleId: string;
    }): Promise<void>;
}
export declare class ClaudeLogicalThreadConflictError extends Error {
    readonly threadId: string;
    readonly expectedGeneration: number;
    readonly actualGeneration: number;
    constructor(threadId: string, expectedGeneration: number, actualGeneration: number);
}
export declare class FileClaudeLogicalThreadStore implements ClaudeLogicalThreadStore {
    private readonly rootDir;
    private readonly threadsDir;
    private readonly locksDir;
    constructor(rootDir: string);
    read(threadId: string): Promise<ClaudeLogicalThreadState | null>;
    compareAndSwap(input: {
        readonly threadId: string;
        readonly expectedGeneration: number;
        readonly next: Omit<ClaudeLogicalThreadState, "generation">;
    }): Promise<ClaudeLogicalThreadState>;
    updateExclusive<T>(input: {
        readonly threadId: string;
        readonly update: (current: ClaudeLogicalThreadState | null) => Promise<{
            readonly next: Omit<ClaudeLogicalThreadState, "generation">;
            readonly value: T;
        }>;
    }): Promise<{
        readonly state: ClaudeLogicalThreadState;
        readonly value: T;
    }>;
    private writeNextState;
    private withThreadLock;
    private threadPath;
}
export declare class FileClaudeTranscriptBundleStore implements ClaudeTranscriptBundleStore {
    private readonly rootDir;
    private readonly bundlesDir;
    constructor(rootDir: string);
    capture(input: {
        readonly sourceConfigDir: string;
        readonly cwd: string;
        readonly sessionId: string;
    }): Promise<ClaudeTranscriptBundle>;
    materialize(input: {
        readonly bundleId: string;
        readonly targetConfigDir: string;
    }): Promise<ClaudeTranscriptBundle>;
    remove(input: {
        readonly bundleId: string;
    }): Promise<void>;
    private bundleDir;
}
//# sourceMappingURL=thread-handoff.d.ts.map