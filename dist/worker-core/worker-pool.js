import { SubscriptionWorkerError } from "./errors.js";
const defaultMaxQueueSize = 1024;
const defaultShutdownTimeoutMs = 30_000;
export class BoundedSubscriptionWorkerPool {
    options;
    slots = [];
    queue = [];
    poolState = "created";
    completedCount = 0;
    failedCount = 0;
    restartedCount = 0;
    inFlightCount = 0;
    cooldownDrainAt = null;
    cooldownDrainTimer = null;
    idempotentRuns = new Map();
    constructor(options) {
        this.options = options;
        if (!options.poolId.trim()) {
            throw new SubscriptionWorkerError("subscription_worker_pool_empty", "Worker pool id is required.");
        }
        if (!Number.isInteger(options.slots) || options.slots <= 0) {
            throw new SubscriptionWorkerError("subscription_worker_pool_empty", "Worker pool must have at least one slot.");
        }
    }
    get poolId() {
        return this.options.poolId;
    }
    get state() {
        return this.poolState;
    }
    async start() {
        if (this.poolState === "disposed") {
            throw new SubscriptionWorkerError("subscription_worker_disposed", "Worker pool has been disposed.");
        }
        if (this.poolState !== "created" && this.poolState !== "failed") {
            throw new SubscriptionWorkerError("subscription_worker_already_started", "Worker pool is already started.");
        }
        this.poolState = "starting";
        try {
            for (let index = 0; index < this.options.slots; index += 1) {
                const slot = this.createSlot(index);
                try {
                    await this.withStartTimeout(slot.worker.start(), {
                        phase: "start",
                        slotIndex: String(slot.index),
                        workerId: slot.worker.workerId,
                    });
                }
                catch (error) {
                    if (isStartTimeoutError(error)) {
                        void slot.worker.dispose().catch(() => {
                            // Best-effort cleanup after a timed-out start.
                        });
                    }
                    else {
                        await slot.worker.dispose().catch(() => {
                            // Best-effort cleanup after a failed start.
                        });
                    }
                    throw error;
                }
                this.slots.push(slot);
            }
            this.poolState = "started";
            if (this.options.prewarmOnStart) {
                this.poolState = "prewarming";
                await this.withStartTimeout(Promise.all(this.slots.map((slot) => slot.worker.prewarm())), { phase: "prewarm" });
                this.poolState = "ready";
                this.emit("subscription_worker_pool.prewarmed");
            }
            this.emit("subscription_worker_pool.started");
        }
        catch (error) {
            this.poolState = "failed";
            if (isStartTimeoutError(error)) {
                void this.disposeStartedSlots().catch(() => {
                    // Best-effort cleanup after a timed-out pool start.
                });
                throw error;
            }
            await this.disposeStartedSlots();
            throw new SubscriptionWorkerError("subscription_worker_start_failed", "Worker pool failed to start.", { cause: error });
        }
    }
    async prewarm() {
        this.assertRunnable();
        this.poolState = "prewarming";
        try {
            const results = await Promise.all(this.slots.map((slot) => slot.worker.prewarm()));
            this.poolState = "ready";
            this.emit("subscription_worker_pool.prewarmed");
            return results;
        }
        catch (error) {
            this.poolState = "failed";
            throw new SubscriptionWorkerError("subscription_worker_prewarm_failed", "Worker pool failed to prewarm.", { cause: error });
        }
    }
    run(job, options = {}) {
        this.assertRunnable();
        if (options.abortSignal?.aborted) {
            return Promise.reject(runAbortedError());
        }
        if (this.poolState === "draining") {
            return Promise.reject(new SubscriptionWorkerError("subscription_worker_pool_draining", "Worker pool is draining and does not accept new work."));
        }
        const idempotencyKey = normalizeIdempotencyKey(options.idempotencyKey);
        if (idempotencyKey) {
            const existing = this.idempotentRuns.get(idempotencyKey);
            if (existing) {
                return waitForIdempotentRun(existing, options.abortSignal);
            }
        }
        const run = this.startRun(job, options);
        if (!idempotencyKey)
            return run;
        this.idempotentRuns.set(idempotencyKey, run);
        const cleanup = () => {
            if (this.idempotentRuns.get(idempotencyKey) === run) {
                this.idempotentRuns.delete(idempotencyKey);
            }
        };
        run.then(cleanup, cleanup);
        return run;
    }
    startRun(job, options) {
        const selected = this.selectAvailableSlot(job, this.now());
        const available = selected.slot;
        if (available) {
            return this.runOnSlotWithRetry(available, job, options, 1);
        }
        this.scheduleCooldownDrain(selected.snapshots);
        const unavailableError = capacityUnavailableError(selected.snapshots);
        if (unavailableError)
            return Promise.reject(unavailableError);
        if (this.queue.length >= (this.options.maxQueueSize ?? defaultMaxQueueSize)) {
            return Promise.reject(new SubscriptionWorkerError("subscription_worker_pool_queue_full", "Worker pool queue is full."));
        }
        return new Promise((resolve, reject) => {
            let settled = false;
            const resolveOnce = (result) => {
                if (settled)
                    return;
                settled = true;
                options.abortSignal?.removeEventListener("abort", abort);
                resolve(result);
            };
            const rejectOnce = (error) => {
                if (settled)
                    return;
                settled = true;
                options.abortSignal?.removeEventListener("abort", abort);
                reject(error);
            };
            const abort = () => {
                const index = this.queue.indexOf(queued);
                if (index >= 0)
                    this.queue.splice(index, 1);
                rejectOnce(runAbortedError());
            };
            const queued = {
                job,
                options,
                resolve: resolveOnce,
                reject: rejectOnce,
            };
            options.abortSignal?.addEventListener("abort", abort, { once: true });
            this.queue.push(queued);
            this.drainQueue();
        });
    }
    async restartSlot(slotIndex, options = {}) {
        this.assertRunnable();
        const slot = this.slots[slotIndex];
        if (!slot) {
            throw new SubscriptionWorkerError("subscription_worker_pool_slot_not_found", "Worker pool slot was not found.", { details: { slotIndex: String(slotIndex) } });
        }
        if (slot.busy) {
            throw new SubscriptionWorkerError("subscription_worker_pool_slot_busy", "Worker pool slot is busy and cannot be restarted.", { details: { slotIndex: String(slotIndex) } });
        }
        this.emit("subscription_worker_pool.slot_restart.started", {
            slotIndex: String(slotIndex),
            workerId: slot.worker.workerId,
        });
        slot.busy = true;
        const next = this.createSlot(slotIndex);
        try {
            await slot.worker.dispose();
            await next.worker.start();
            if (options.prewarm) {
                await next.worker.prewarm();
            }
            this.slots[slotIndex] = next;
        }
        catch (error) {
            this.slots.splice(slotIndex, 1);
            this.poolState = "failed";
            const restartError = new SubscriptionWorkerError("subscription_worker_pool_slot_restart_failed", "Worker pool slot failed to restart.", {
                cause: error,
                details: {
                    slotIndex: String(slotIndex),
                    workerId: next.worker.workerId,
                },
            });
            await next.worker.dispose().catch(() => {
                // Best-effort cleanup after a failed replacement.
            });
            if (this.slots.length === 0) {
                this.rejectQueued(restartError);
            }
            else {
                this.drainQueue();
            }
            throw restartError;
        }
        this.restartedCount += 1;
        this.emit("subscription_worker_pool.slot_restart.completed", {
            slotIndex: String(slotIndex),
            workerId: next.worker.workerId,
        });
        this.drainQueue();
    }
    async health() {
        const checkedAt = this.now();
        this.slotSnapshots(checkedAt);
        const slotHealth = await Promise.all(this.slots.map((slot) => safeHealth(slot.worker, checkedAt)));
        const unhealthy = slotHealth.filter((health) => health.status === "unhealthy");
        const degraded = slotHealth.filter((health) => health.status === "degraded");
        const status = unhealthy.length > 0
            ? "unhealthy"
            : degraded.length > 0 || this.poolState === "failed"
                ? "degraded"
                : "healthy";
        return {
            poolId: this.options.poolId,
            status,
            state: this.poolState,
            checkedAt,
            slots: slotHealth,
            queued: this.queue.length,
            inFlight: this.inFlightCount,
        };
    }
    stats() {
        return {
            poolId: this.options.poolId,
            state: this.poolState,
            slots: this.slots.length,
            queued: this.queue.length,
            inFlight: this.inFlightCount,
            completed: this.completedCount,
            failed: this.failedCount,
            restarted: this.restartedCount,
        };
    }
    async dispose() {
        if (this.poolState === "disposed")
            return;
        this.poolState = "draining";
        this.clearCooldownDrainTimer();
        const deadline = Date.now() + (this.options.shutdownTimeoutMs ?? defaultShutdownTimeoutMs);
        while (this.inFlightCount > 0 && Date.now() < deadline) {
            await delay(25);
        }
        if (this.inFlightCount > 0) {
            this.rejectQueued(new SubscriptionWorkerError("subscription_worker_shutdown_timeout", "Worker pool shutdown timed out with in-flight work."));
        }
        else {
            this.rejectQueued(new SubscriptionWorkerError("subscription_worker_pool_draining", "Worker pool was disposed before queued work started."));
        }
        await this.disposeStartedSlots();
        this.poolState = "disposed";
        this.emit("subscription_worker_pool.disposed");
    }
    runOnSlot(slot, job, options) {
        if (options.abortSignal?.aborted) {
            return Promise.reject(runAbortedError());
        }
        slot.busy = true;
        this.inFlightCount += 1;
        return slot.worker
            .run(job, options.abortSignal ? { abortSignal: options.abortSignal } : {})
            .then((result) => {
            this.completedCount += 1;
            return result;
        })
            .catch((error) => {
            this.failedCount += 1;
            throw new SubscriptionWorkerError("subscription_worker_pool_slot_failed", "Worker pool slot failed to run a task.", {
                cause: error,
                details: {
                    workerId: slot.worker.workerId,
                    slotIndex: String(slot.index),
                },
            });
        })
            .finally(() => {
            slot.busy = false;
            this.inFlightCount -= 1;
            this.drainQueue();
        });
    }
    createSlot(index) {
        const workerId = `${this.options.poolId}:slot-${index + 1}`;
        return {
            index,
            worker: this.options.workerFactory({
                slotIndex: index,
                workerId,
            }),
            busy: false,
        };
    }
    drainQueue() {
        if (this.poolState === "draining" || this.poolState === "disposed")
            return;
        while (this.queue.length > 0) {
            const next = this.queue[0];
            if (!next)
                return;
            const selected = this.selectAvailableSlot(next.job, this.now());
            if (!selected.slot) {
                this.scheduleCooldownDrain(selected.snapshots);
                const unavailableError = capacityUnavailableError(selected.snapshots);
                if (unavailableError) {
                    this.rejectQueued(unavailableError);
                }
                return;
            }
            if (this.queue[0] !== next) {
                continue;
            }
            this.queue.shift();
            if (next.options.abortSignal?.aborted) {
                next.reject(runAbortedError());
                continue;
            }
            void this.runOnSlotWithRetry(selected.slot, next.job, next.options, 1)
                .then(next.resolve)
                .catch(next.reject);
        }
    }
    async runOnSlotWithRetry(slot, job, options, attempt) {
        try {
            return await this.runOnSlot(slot, job, options);
        }
        catch (error) {
            if (!this.shouldRetryOnAnotherSlot(slot, options, attempt)) {
                throw error;
            }
            const selected = this.selectAvailableSlot(job, this.now());
            if (!selected.slot) {
                this.scheduleCooldownDrain(selected.snapshots);
                throw error;
            }
            this.emit("subscription_worker_pool.slot_retry", {
                fromSlotIndex: String(slot.index),
                fromWorkerId: slot.worker.workerId,
                toSlotIndex: String(selected.slot.index),
                toWorkerId: selected.slot.worker.workerId,
                attempt: String(attempt + 1),
            });
            return this.runOnSlotWithRetry(selected.slot, job, options, attempt + 1);
        }
    }
    shouldRetryOnAnotherSlot(failedSlot, options, attempt) {
        const policy = retryPolicy(options, this.options.retryPolicy);
        if (!policy.retryOnSlotCapacityUnavailable)
            return false;
        if (attempt >= policy.maxAttempts)
            return false;
        if (options.abortSignal?.aborted)
            return false;
        return (this.slotCapacity(failedSlot, this.now()).availability !== "available");
    }
    selectAvailableSlot(job, now) {
        const snapshots = this.slotSnapshots(now);
        const available = snapshots.filter((snapshot) => !snapshot.busy && snapshot.capacity.availability === "available");
        if (available.length === 0) {
            return { slot: null, snapshots };
        }
        const selected = this.options.slotSelector?.({ slots: snapshots, job, now }) ??
            available[0] ??
            null;
        if (!selected) {
            return { slot: null, snapshots };
        }
        const snapshot = snapshots.find((candidate) => candidate.slotIndex === selected.slotIndex);
        if (!snapshot ||
            snapshot.busy ||
            snapshot.capacity.availability !== "available") {
            throw new SubscriptionWorkerError("subscription_worker_pool_selector_invalid", "Worker pool slot selector returned an unavailable slot.", {
                details: {
                    slotIndex: String(selected.slotIndex),
                    ...(snapshot ? { workerId: snapshot.workerId } : {}),
                },
            });
        }
        return {
            slot: this.slots[snapshot.slotIndex] ?? null,
            snapshots,
        };
    }
    slotSnapshots(now) {
        return this.slots.map((slot) => ({
            slotIndex: slot.index,
            workerId: slot.worker.workerId,
            busy: slot.busy,
            capacity: this.slotCapacity(slot, now),
        }));
    }
    slotCapacity(slot, now) {
        if (slot.busy)
            return { availability: "busy" };
        const worker = capacityAwareWorker(slot.worker);
        if (!worker)
            return { availability: "available" };
        return normalizeCapacity(worker.capacity(), now);
    }
    scheduleCooldownDrain(snapshots) {
        const nextCooldownAt = snapshots.reduce((nextAt, snapshot) => {
            if (!isResettableCapacity(snapshot.capacity) ||
                !snapshot.capacity.cooldownUntil) {
                return nextAt;
            }
            const candidate = snapshot.capacity.cooldownUntil.getTime();
            return nextAt === null ? candidate : Math.min(nextAt, candidate);
        }, null);
        if (nextCooldownAt === null)
            return;
        if (this.cooldownDrainAt !== null &&
            this.cooldownDrainAt <= nextCooldownAt) {
            return;
        }
        this.clearCooldownDrainTimer();
        this.cooldownDrainAt = nextCooldownAt;
        this.cooldownDrainTimer = this.setTimer(() => {
            this.cooldownDrainAt = null;
            this.cooldownDrainTimer = null;
            this.drainQueue();
        }, Math.max(0, nextCooldownAt - this.now().getTime()));
    }
    clearCooldownDrainTimer() {
        if (this.cooldownDrainTimer) {
            this.clearTimer(this.cooldownDrainTimer);
            this.cooldownDrainTimer = null;
        }
        this.cooldownDrainAt = null;
    }
    assertRunnable() {
        if (this.poolState === "disposed") {
            throw new SubscriptionWorkerError("subscription_worker_disposed", "Worker pool has been disposed.");
        }
        if (this.slots.length === 0) {
            throw new SubscriptionWorkerError("subscription_worker_not_started", "Worker pool has not been started.");
        }
    }
    rejectQueued(error) {
        const queued = this.queue.splice(0);
        for (const item of queued)
            item.reject(error);
    }
    async disposeStartedSlots() {
        const slots = this.slots.splice(0);
        const results = await Promise.allSettled(slots.map((slot) => slot.worker.dispose()));
        const rejected = results.filter((result) => result.status === "rejected");
        if (rejected.length > 0) {
            throw new AggregateError(rejected.map((result) => result.reason), "subscription_worker_pool_dispose_failed");
        }
    }
    emit(name, metadata = {}) {
        this.options.observability?.emit({
            name,
            metadata: {
                poolId: this.options.poolId,
                slots: String(this.options.slots),
                ...metadata,
            },
        });
    }
    now() {
        return this.options.clock?.now() ?? new Date();
    }
    setTimer(callback, delayMs) {
        return (this.options.scheduler?.setTimeout(callback, delayMs) ??
            setTimeout(callback, delayMs));
    }
    clearTimer(handle) {
        if (this.options.scheduler) {
            this.options.scheduler.clearTimeout(handle);
            return;
        }
        clearTimeout(handle);
    }
    withStartTimeout(operation, details) {
        const timeoutMs = this.options.startTimeoutMs;
        if (timeoutMs === undefined ||
            !Number.isFinite(timeoutMs) ||
            timeoutMs < 0) {
            return operation;
        }
        return new Promise((resolve, reject) => {
            let settled = false;
            let timer = null;
            const settle = (callback) => {
                if (settled)
                    return;
                settled = true;
                if (timer !== null)
                    this.clearTimer(timer);
                callback();
            };
            timer = this.setTimer(() => {
                settle(() => reject(new SubscriptionWorkerError("subscription_worker_start_timeout", `Worker pool start timed out after ${timeoutMs} ms.`, {
                    details: {
                        ...details,
                        timeoutMs: String(timeoutMs),
                    },
                })));
            }, timeoutMs);
            operation.then((result) => settle(() => resolve(result)), (error) => settle(() => reject(error)));
        });
    }
}
async function safeHealth(worker, checkedAt) {
    try {
        return await worker.health();
    }
    catch (error) {
        return {
            status: "unhealthy",
            state: "failed",
            checkedAt,
            failures: [
                {
                    code: "subscription_worker_health_failed",
                    safeMessage: error instanceof Error ? error.message : "Worker health failed.",
                },
            ],
            warnings: [],
        };
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function runAbortedError() {
    return new SubscriptionWorkerError("subscription_worker_pool_run_aborted", "Worker pool run was aborted before it started.");
}
function isStartTimeoutError(error) {
    return (error instanceof SubscriptionWorkerError &&
        error.code === "subscription_worker_start_timeout");
}
function normalizeIdempotencyKey(value) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}
function waitForIdempotentRun(run, abortSignal) {
    if (!abortSignal)
        return run;
    if (abortSignal.aborted)
        return Promise.reject(runAbortedError());
    return new Promise((resolve, reject) => {
        const cleanup = () => abortSignal.removeEventListener("abort", abort);
        const abort = () => {
            cleanup();
            reject(runAbortedError());
        };
        abortSignal.addEventListener("abort", abort, { once: true });
        run.then((result) => {
            cleanup();
            resolve(result);
        }, (error) => {
            cleanup();
            reject(error);
        });
    });
}
function retryPolicy(options, poolPolicy) {
    const maxAttempts = options.retryPolicy?.maxAttempts ?? poolPolicy?.maxAttempts ?? 1;
    return {
        maxAttempts: Math.max(1, maxAttempts),
        retryOnSlotCapacityUnavailable: options.retryPolicy?.retryOnSlotCapacityUnavailable ??
            poolPolicy?.retryOnSlotCapacityUnavailable ??
            false,
    };
}
function capacityAwareWorker(worker) {
    if ("capacity" in worker && typeof worker.capacity === "function") {
        return worker;
    }
    return null;
}
function normalizeCapacity(capacity, now) {
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
function capacityUnavailableError(snapshots) {
    if (snapshots.some((snapshot) => snapshot.busy))
        return null;
    if (snapshots.some((snapshot) => isResettableCapacity(snapshot.capacity) &&
        snapshot.capacity.cooldownUntil)) {
        return null;
    }
    const unavailable = snapshots.filter((snapshot) => snapshot.capacity.availability !== "available");
    if (unavailable.length === 0)
        return null;
    return new SubscriptionWorkerError("subscription_worker_pool_capacity_unavailable", "Worker pool has no available or resettable-capacity slots.", {
        details: {
            availability: summarizeAvailability(unavailable),
        },
    });
}
function summarizeAvailability(snapshots) {
    const counts = new Map();
    for (const snapshot of snapshots) {
        counts.set(snapshot.capacity.availability, (counts.get(snapshot.capacity.availability) ?? 0) + 1);
    }
    return [...counts.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([availability, count]) => `${availability}:${count}`)
        .join(",");
}
//# sourceMappingURL=worker-pool.js.map