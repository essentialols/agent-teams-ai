import type { CapacityAwareSubscriptionWorker, SubscriptionWorker, SubscriptionWorkerHealth, SubscriptionWorkerPrewarmResult, SubscriptionWorkerFactory, SubscriptionWorkerRunOptions, SubscriptionWorkerState, WorkerCapacitySnapshot } from "./types.js";
export type WorkerAccountCapacityStore = {
    read(input: {
        readonly accountId: string;
        readonly now?: Date;
    }): WorkerCapacitySnapshot | null;
    observe(input: WorkerAccountLimitSignal): void;
    clear(input: {
        readonly accountId: string;
    }): void;
};
export type WorkerAccountLimitSignal = {
    readonly accountId: string;
    readonly capacity: WorkerCapacitySnapshot;
    readonly observedAt: Date;
    readonly sourceWorkerId?: string;
};
export type AccountCapacityAwareWorkerOptions<Job, Result> = {
    readonly worker: SubscriptionWorker<Job, Result>;
    readonly accountCapacityStore: WorkerAccountCapacityStore;
    readonly accountId?: string;
    readonly accountIdFromCapacityDetails?: (details: Readonly<Record<string, string>> | undefined) => string | null;
    readonly limitReasons?: readonly string[];
    readonly clock?: {
        now(): Date;
    };
};
export type AccountCapacityAwareWorkerFactoryOptions<Job, Result> = Omit<AccountCapacityAwareWorkerOptions<Job, Result>, "worker"> & {
    readonly workerFactory: SubscriptionWorkerFactory<Job, Result>;
};
export declare class InMemoryWorkerAccountCapacityStore implements WorkerAccountCapacityStore {
    private readonly records;
    read(input: {
        readonly accountId: string;
        readonly now?: Date;
    }): WorkerCapacitySnapshot | null;
    observe(input: WorkerAccountLimitSignal): void;
    clear(input: {
        readonly accountId: string;
    }): void;
}
export declare class AccountCapacityAwareWorker<Job, Result> implements CapacityAwareSubscriptionWorker<Job, Result> {
    private readonly options;
    private readonly clock;
    private readonly limitReasons;
    constructor(options: AccountCapacityAwareWorkerOptions<Job, Result>);
    get workerId(): string;
    get state(): SubscriptionWorkerState;
    start(): Promise<void>;
    prewarm(): Promise<SubscriptionWorkerPrewarmResult>;
    run(job: Job, options?: SubscriptionWorkerRunOptions): Promise<Result>;
    health(): Promise<SubscriptionWorkerHealth>;
    capacity(): WorkerCapacitySnapshot;
    dispose(): Promise<void>;
    private workerCapacity;
    private observeWorkerCapacity;
    private accountId;
}
export declare function accountCapacityAwareWorkerFactory<Job, Result>(options: AccountCapacityAwareWorkerFactoryOptions<Job, Result>): SubscriptionWorkerFactory<Job, Result>;
export declare function defaultAccountIdFromCapacityDetails(details: Readonly<Record<string, string>> | undefined): string | null;
export declare function normalizeWorkerAccountId(value: string | null | undefined): string | null;
export declare function normalizeWorkerAccountCapacitySignal(input: WorkerAccountLimitSignal): WorkerCapacitySnapshot | null;
export declare function shouldKeepExistingWorkerAccountCapacity(existing: WorkerCapacitySnapshot, next: WorkerCapacitySnapshot): boolean;
export declare function isPersistableWorkerAccountCapacity(capacity: WorkerCapacitySnapshot): boolean;
export declare function isPersistableWorkerAccountAvailability(value: unknown): value is WorkerCapacitySnapshot["availability"];
//# sourceMappingURL=account-capacity.d.ts.map