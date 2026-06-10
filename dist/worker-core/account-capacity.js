import { SubscriptionWorkerError } from "./errors.js";
const defaultLimitReasons = [
    "rate_limit_threshold",
    "quota_limited",
    "account_exhausted",
];
export class InMemoryWorkerAccountCapacityStore {
    records = new Map();
    read(input) {
        const accountId = normalizeWorkerAccountId(input.accountId);
        if (!accountId)
            return null;
        const current = this.records.get(accountId);
        if (!current)
            return null;
        const now = input.now ?? new Date();
        if (current.cooldownUntil &&
            current.cooldownUntil.getTime() <= now.getTime()) {
            this.records.delete(accountId);
            return null;
        }
        return current;
    }
    observe(input) {
        const accountId = normalizeWorkerAccountId(input.accountId);
        if (!accountId)
            return;
        const capacity = normalizeWorkerAccountCapacitySignal(input);
        if (!capacity)
            return;
        const existing = this.read({
            accountId,
            now: input.observedAt,
        });
        if (existing &&
            shouldKeepExistingWorkerAccountCapacity(existing, capacity)) {
            return;
        }
        this.records.set(accountId, capacity);
    }
    clear(input) {
        const accountId = normalizeWorkerAccountId(input.accountId);
        if (!accountId)
            return;
        this.records.delete(accountId);
    }
}
export class AccountCapacityAwareWorker {
    options;
    clock;
    limitReasons;
    constructor(options) {
        this.options = options;
        this.clock = options.clock ?? systemClock;
        this.limitReasons = options.limitReasons ?? defaultLimitReasons;
    }
    get workerId() {
        return this.options.worker.workerId;
    }
    get state() {
        return this.options.worker.state;
    }
    start() {
        return this.options.worker.start();
    }
    prewarm() {
        return this.options.worker.prewarm();
    }
    async run(job, options) {
        const current = this.capacity();
        if (current.availability !== "available") {
            throw new SubscriptionWorkerError("subscription_worker_account_unavailable", "Worker account capacity is unavailable.", {
                details: {
                    workerId: this.workerId,
                    availability: current.availability,
                    ...(current.reason ? { reason: current.reason } : {}),
                    ...(current.cooldownUntil
                        ? { cooldownUntil: current.cooldownUntil.toISOString() }
                        : {}),
                    ...(current.details?.accountId
                        ? { accountId: current.details.accountId }
                        : {}),
                },
            });
        }
        try {
            const result = await this.options.worker.run(job, options);
            this.observeWorkerCapacity(this.workerCapacity());
            return result;
        }
        catch (error) {
            this.observeWorkerCapacity(this.workerCapacity());
            throw error;
        }
    }
    async health() {
        const health = await this.options.worker.health();
        const capacity = this.capacity();
        if (capacity.availability === "available" || health.status !== "healthy") {
            return health;
        }
        return {
            status: "degraded",
            state: health.state,
            checkedAt: health.checkedAt,
            failures: [
                {
                    code: capacity.reason ?? capacity.availability,
                    safeMessage: `Worker account capacity is ${capacity.availability}.`,
                },
            ],
            warnings: health.warnings,
            details: {
                ...(health.details ?? {}),
                ...(capacity.details ?? {}),
            },
        };
    }
    capacity() {
        const now = this.clock.now();
        const workerCapacity = normalizeWorkerCapacity(this.workerCapacity(), now);
        this.observeWorkerCapacity(workerCapacity);
        const accountId = this.accountId(workerCapacity);
        if (!accountId)
            return workerCapacity;
        const accountCapacity = this.options.accountCapacityStore.read({
            accountId,
            now,
        });
        if (!accountCapacity) {
            return withAccountDetails(workerCapacity, accountId);
        }
        return mergeWorkerAndAccountCapacity(withAccountDetails(workerCapacity, accountId), withAccountDetails(accountCapacity, accountId));
    }
    dispose() {
        return this.options.worker.dispose();
    }
    workerCapacity() {
        const worker = this.options.worker;
        if (isCapacityAwareWorker(worker))
            return worker.capacity();
        return { availability: "available" };
    }
    observeWorkerCapacity(capacity) {
        if (!isAccountLimitCapacity(capacity, this.limitReasons))
            return;
        const accountId = this.accountId(capacity);
        if (!accountId)
            return;
        this.options.accountCapacityStore.observe({
            accountId,
            capacity,
            observedAt: capacity.lastLimitSignalAt ?? this.clock.now(),
            sourceWorkerId: this.workerId,
        });
    }
    accountId(capacity) {
        const explicitAccountId = normalizeWorkerAccountId(this.options.accountId);
        if (explicitAccountId)
            return explicitAccountId;
        return (this.options.accountIdFromCapacityDetails?.(capacity.details) ??
            defaultAccountIdFromCapacityDetails(capacity.details));
    }
}
export function accountCapacityAwareWorkerFactory(options) {
    return (input) => new AccountCapacityAwareWorker({
        worker: options.workerFactory(input),
        accountCapacityStore: options.accountCapacityStore,
        ...(options.accountId ? { accountId: options.accountId } : {}),
        ...(options.accountIdFromCapacityDetails
            ? {
                accountIdFromCapacityDetails: options.accountIdFromCapacityDetails,
            }
            : {}),
        ...(options.limitReasons ? { limitReasons: options.limitReasons } : {}),
        ...(options.clock ? { clock: options.clock } : {}),
    });
}
export function defaultAccountIdFromCapacityDetails(details) {
    return normalizeWorkerAccountId(details?.accountId ?? details?.quotaGroup ?? details?.subscriptionAccountId);
}
export function normalizeWorkerAccountId(value) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}
export function normalizeWorkerAccountCapacitySignal(input) {
    const accountId = normalizeWorkerAccountId(input.accountId);
    if (!accountId)
        return null;
    const capacity = input.capacity;
    if (!isPersistableAccountCapacity(capacity))
        return null;
    if (capacity.cooldownUntil &&
        capacity.cooldownUntil.getTime() <= input.observedAt.getTime()) {
        return null;
    }
    return {
        availability: capacity.availability,
        ...(capacity.reason ? { reason: capacity.reason } : {}),
        ...(capacity.cooldownUntil
            ? { cooldownUntil: capacity.cooldownUntil }
            : {}),
        lastLimitSignalAt: input.observedAt,
        details: {
            ...(capacity.details ?? {}),
            accountId,
            ...(input.sourceWorkerId ? { sourceWorkerId: input.sourceWorkerId } : {}),
        },
    };
}
export function shouldKeepExistingWorkerAccountCapacity(existing, next) {
    if (severity(existing) > severity(next))
        return true;
    if (severity(existing) < severity(next))
        return false;
    const existingResetAt = existing.cooldownUntil?.getTime();
    const nextResetAt = next.cooldownUntil?.getTime();
    if (nextResetAt === undefined)
        return true;
    if (existingResetAt === undefined)
        return false;
    return existingResetAt >= nextResetAt;
}
function isAccountLimitCapacity(capacity, limitReasons) {
    if (!isPersistableAccountCapacity(capacity))
        return false;
    if (!capacity.reason)
        return true;
    return limitReasons.includes(capacity.reason);
}
function isPersistableAccountCapacity(capacity) {
    return (capacity.availability === "cooldown" ||
        capacity.availability === "quota_exhausted");
}
function mergeWorkerAndAccountCapacity(worker, account) {
    if (worker.availability === "available") {
        return {
            ...account,
            details: {
                ...(account.details ?? {}),
                ...(worker.details ?? {}),
            },
        };
    }
    if (severity(account) > severity(worker)) {
        return {
            ...account,
            details: {
                ...(account.details ?? {}),
                ...(worker.details ?? {}),
            },
        };
    }
    if (severity(account) === severity(worker) &&
        worker.cooldownUntil &&
        account.cooldownUntil &&
        account.cooldownUntil.getTime() > worker.cooldownUntil.getTime()) {
        return {
            ...account,
            details: {
                ...(account.details ?? {}),
                ...(worker.details ?? {}),
            },
        };
    }
    return worker;
}
function withAccountDetails(capacity, accountId) {
    return {
        ...capacity,
        details: {
            ...(capacity.details ?? {}),
            accountId,
        },
    };
}
function normalizeWorkerCapacity(capacity, now) {
    if (!isResettableCapacity(capacity) ||
        !capacity.cooldownUntil ||
        capacity.cooldownUntil.getTime() > now.getTime()) {
        return capacity;
    }
    const { cooldownUntil: _cooldownUntil, lastLimitSignalAt: _lastLimitSignalAt, reason: _reason, ...rest } = capacity;
    return {
        ...rest,
        availability: "available",
    };
}
function isResettableCapacity(capacity) {
    return (capacity.availability === "cooldown" ||
        capacity.availability === "quota_exhausted");
}
function severity(capacity) {
    switch (capacity.availability) {
        case "disabled":
            return 70;
        case "quota_exhausted":
            return 60;
        case "cooldown":
            return 50;
        case "degraded":
            return 40;
        case "warming":
            return 30;
        case "busy":
            return 20;
        case "available":
            return 10;
    }
}
function isCapacityAwareWorker(worker) {
    return typeof worker.capacity === "function";
}
const systemClock = {
    now() {
        return new Date();
    },
};
//# sourceMappingURL=account-capacity.js.map