import { describe, expect, it } from "vitest";
import {
  BoundedSubscriptionWorkerPool,
  type SubscriptionWorker,
  type WorkerCapacitySnapshot,
  type SubscriptionWorkerPrewarmResult,
  type SubscriptionWorkerState,
} from "../index";

describe("BoundedSubscriptionWorkerPool", () => {
  it("runs no more than the configured slot count concurrently", async () => {
    let active = 0;
    let maxActive = 0;
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "test-pool",
      slots: 2,
      workerFactory: ({ workerId }) =>
        new FakeWorker(workerId, async (job) => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          await delay(20);
          active -= 1;
          return `done:${job}`;
        }),
    });

    await pool.start();
    const results = await Promise.all([
      pool.run("a"),
      pool.run("b"),
      pool.run("c"),
      pool.run("d"),
    ]);
    await pool.dispose();

    expect(results).toEqual(["done:a", "done:b", "done:c", "done:d"]);
    expect(maxActive).toBe(2);
    expect(pool.stats()).toMatchObject({
      completed: 4,
      failed: 0,
      state: "disposed",
    });
  });

  it("skips idle slots that report unavailable capacity", async () => {
    const workers: FakeWorker[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "capacity",
      slots: 2,
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(
          workerId,
          async (job) => `${workerId}:${job}`,
        );
        workers.push(worker);
        return worker;
      },
    });

    await pool.start();
    workers[0]!.capacitySnapshot = {
      availability: "cooldown",
      cooldownUntil: new Date(Date.now() + 60_000),
    };
    const result = await pool.run("job");
    await pool.dispose();

    expect(result).toBe("capacity:slot-2:job");
  });

  it("uses a slot selector to choose among available slots", async () => {
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "selector",
      slots: 3,
      slotSelector: ({ slots }) =>
        slots.find((slot) => slot.workerId === "selector:slot-3") ?? null,
      workerFactory: ({ workerId }) =>
        new FakeWorker(workerId, async (job) => `${workerId}:${job}`),
    });

    await pool.start();
    const result = await pool.run("job");
    await pool.dispose();

    expect(result).toBe("selector:slot-3:job");
  });

  it("drains queued work after a cooldown expires", async () => {
    const workers: FakeWorker[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "cooldown",
      slots: 1,
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(
          workerId,
          async (job) => `${workerId}:${job}`,
        );
        workers.push(worker);
        return worker;
      },
    });

    await pool.start();
    workers[0]!.capacitySnapshot = {
      availability: "cooldown",
      cooldownUntil: new Date(Date.now() + 20),
    };
    const result = pool.run("later");

    expect(pool.stats().queued).toBe(1);
    await expect(result).resolves.toBe("cooldown:slot-1:later");
    await pool.dispose();
  });

  it("drains queued work after a resettable quota exhaustion expires", async () => {
    const workers: FakeWorker[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "quota-reset",
      slots: 1,
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(
          workerId,
          async (job) => `${workerId}:${job}`,
        );
        workers.push(worker);
        return worker;
      },
    });

    await pool.start();
    workers[0]!.capacitySnapshot = {
      availability: "quota_exhausted",
      reason: "quota_limited",
      cooldownUntil: new Date(Date.now() + 20),
    };
    const result = pool.run("later");

    expect(pool.stats().queued).toBe(1);
    await expect(result).resolves.toBe("quota-reset:slot-1:later");
    await pool.dispose();
  });

  it("normalizes expired cooldown snapshots before slot selection", async () => {
    const resetAt = new Date("2026-06-01T00:00:00.000Z");
    const selectedSnapshots: WorkerCapacitySnapshot[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "expired-cooldown",
      slots: 1,
      clock: {
        now: () => new Date("2026-06-01T00:00:00.001Z"),
      },
      slotSelector: ({ slots }) => {
        selectedSnapshots.push(slots[0]!.capacity);
        return slots[0] ?? null;
      },
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(
          workerId,
          async (job) => `${workerId}:${job}`,
        );
        worker.capacitySnapshot = {
          availability: "cooldown",
          reason: "rate_limit_threshold",
          cooldownUntil: resetAt,
          lastLimitSignalAt: new Date("2026-05-31T23:59:00.000Z"),
          details: { accountId: "account-a" },
        };
        return worker;
      },
    });

    await pool.start();
    await expect(pool.run("job")).resolves.toBe("expired-cooldown:slot-1:job");
    await pool.dispose();

    expect(selectedSnapshots).toHaveLength(1);
    expect(selectedSnapshots[0]).toMatchObject({
      availability: "available",
      details: { accountId: "account-a" },
    });
    expect(selectedSnapshots[0]).not.toHaveProperty("reason");
    expect(selectedSnapshots[0]).not.toHaveProperty("cooldownUntil");
    expect(selectedSnapshots[0]).not.toHaveProperty("lastLimitSignalAt");
  });

  it("retries a failed task on another slot when failed slot capacity becomes unavailable", async () => {
    const seen: string[] = [];
    const workers: FakeWorker[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "retry-capacity",
      slots: 2,
      retryPolicy: {
        maxAttempts: 2,
        retryOnSlotCapacityUnavailable: true,
      },
      workerFactory: ({ workerId, slotIndex }) => {
        const worker = new FakeWorker(workerId, async (job) => {
          seen.push(`${workerId}:${job}`);
          if (slotIndex === 0) {
            worker.capacitySnapshot = {
              availability: "cooldown",
              cooldownUntil: new Date(Date.now() + 60_000),
            };
            throw new Error("quota_limited");
          }
          return `${workerId}:${job}`;
        });
        workers.push(worker);
        return worker;
      },
    });

    await pool.start();
    await expect(pool.run("job")).resolves.toBe("retry-capacity:slot-2:job");
    await pool.dispose();

    expect(seen).toEqual([
      "retry-capacity:slot-1:job",
      "retry-capacity:slot-2:job",
    ]);
    expect(workers[0]?.capacity()).toMatchObject({
      availability: "cooldown",
    });
  });

  it("does not retry slot failures unless retry policy opts in", async () => {
    const seen: string[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "retry-disabled",
      slots: 2,
      workerFactory: ({ workerId, slotIndex }) =>
        new FakeWorker(workerId, async (job) => {
          seen.push(`${workerId}:${job}`);
          if (slotIndex === 0) throw new Error("quota_limited");
          return `${workerId}:${job}`;
        }),
    });

    await pool.start();
    await expect(pool.run("job")).rejects.toThrow(
      "Worker pool slot failed to run a task.",
    );
    await pool.dispose();

    expect(seen).toEqual(["retry-disabled:slot-1:job"]);
  });

  it("rejects work when the bounded queue is full", async () => {
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "bounded",
      slots: 1,
      maxQueueSize: 1,
      workerFactory: ({ workerId }) =>
        new FakeWorker(workerId, async (job) => {
          await delay(50);
          return job;
        }),
    });

    await pool.start();
    const first = pool.run("first");
    const queued = pool.run("queued");
    await expect(pool.run("overflow")).rejects.toThrow(
      "Worker pool queue is full.",
    );
    await expect(first).resolves.toBe("first");
    await expect(queued).resolves.toBe("queued");
    await pool.dispose();
  });

  it("removes aborted queued work before it reaches a worker", async () => {
    const seen: string[] = [];
    let releaseFirst: () => void = () => {
      throw new Error("first_job_release_missing");
    };
    let resolveFirstStarted: (() => void) | null = null;
    const firstStarted = new Promise<void>((resolve) => {
      resolveFirstStarted = resolve;
    });
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "abort-queued",
      slots: 1,
      workerFactory: ({ workerId }) =>
        new FakeWorker(workerId, async (job) => {
          seen.push(job);
          if (job === "first") {
            resolveFirstStarted?.();
            await new Promise<void>((release) => {
              releaseFirst = release;
            });
          }
          return job;
        }),
    });

    await pool.start();
    const first = pool.run("first");
    await firstStarted;
    const controller = new AbortController();
    const aborted = pool.run("aborted", {
      abortSignal: controller.signal,
    });
    const next = pool.run("next");
    controller.abort();
    releaseFirst();
    await expect(aborted).rejects.toThrow("Worker pool run was aborted");
    await expect(first).resolves.toBe("first");
    await expect(next).resolves.toBe("next");
    await pool.dispose();
    expect(seen).toEqual(["first", "next"]);
  });

  it("rejects already-aborted work without entering the worker", async () => {
    const seen: string[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "already-aborted",
      slots: 1,
      workerFactory: ({ workerId }) =>
        new FakeWorker(workerId, async (job) => {
          seen.push(job);
          return job;
        }),
    });
    const controller = new AbortController();
    controller.abort();

    await pool.start();
    await expect(
      pool.run("aborted", { abortSignal: controller.signal }),
    ).rejects.toThrow("Worker pool run was aborted");
    await pool.dispose();
    expect(seen).toEqual([]);
  });

  it("prewarms all slots and aggregates health", async () => {
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "health",
      slots: 3,
      prewarmOnStart: true,
      workerFactory: ({ workerId }) => new FakeWorker(workerId),
    });

    await pool.start();
    const health = await pool.health();
    await pool.dispose();

    expect(health).toMatchObject({
      status: "healthy",
      slots: [
        { status: "healthy" },
        { status: "healthy" },
        { status: "healthy" },
      ],
    });
  });

  it("uses the configured clock for pool and failed slot health", async () => {
    const checkedAt = new Date("2026-06-01T12:34:56.000Z");
    const workers: FakeWorker[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "health-clock",
      slots: 1,
      clock: { now: () => checkedAt },
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(workerId);
        workers.push(worker);
        return worker;
      },
    });

    await pool.start();
    workers[0]!.healthError = new Error("health_failed");
    const health = await pool.health();
    await pool.dispose();

    expect(health.checkedAt).toEqual(checkedAt);
    expect(health).toMatchObject({
      status: "unhealthy",
      slots: [
        {
          status: "unhealthy",
          state: "failed",
          checkedAt,
          failures: [{ code: "subscription_worker_health_failed" }],
        },
      ],
    });
  });

  it("restarts an idle slot and prewarms the replacement", async () => {
    const disposed: string[] = [];
    const workers: FakeWorker[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "restart",
      slots: 2,
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(workerId, async (job) => job);
        worker.onDispose = () => disposed.push(workerId);
        workers.push(worker);
        return worker;
      },
    });

    await pool.start();
    await pool.restartSlot(0, { prewarm: true });
    const result = await pool.run("ok");
    await pool.dispose();

    expect(result).toBe("ok");
    expect(disposed).toContain("restart:slot-1");
    expect(workers).toHaveLength(3);
    expect(workers[2]?.workerId).toBe("restart:slot-1");
    expect(workers[2]?.prewarmed).toBe(true);
    expect(pool.stats().restarted).toBe(1);
  });

  it("does not run queued work on a replacement slot before restart completes", async () => {
    const seen: string[] = [];
    const workers: FakeWorker[] = [];
    const replacementStarted = deferred<void>();
    const releaseReplacement = deferred<void>();
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "restart-publish",
      slots: 1,
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(workerId, async (job) => {
          seen.push(job);
          return job;
        });
        workers.push(worker);
        if (workers.length === 2) {
          worker.onStart = () => replacementStarted.resolve();
          worker.startGate = releaseReplacement.promise;
        }
        return worker;
      },
    });

    await pool.start();
    const restart = pool.restartSlot(0);
    await replacementStarted.promise;
    const queued = pool.run("queued");

    await delay(20);
    expect(seen).toEqual([]);

    releaseReplacement.resolve();
    await restart;
    await expect(queued).resolves.toBe("queued");
    await pool.dispose();
    expect(seen).toEqual(["queued"]);
  });

  it("does not leave a disposed slot runnable after restart failure", async () => {
    const workers: FakeWorker[] = [];
    const pool = new BoundedSubscriptionWorkerPool<string, string>({
      poolId: "restart-failure",
      slots: 1,
      workerFactory: ({ workerId }) => {
        const worker = new FakeWorker(workerId, async (job) => job);
        workers.push(worker);
        if (workers.length === 2) {
          worker.failStart = true;
        }
        return worker;
      },
    });

    await pool.start();
    await expect(pool.restartSlot(0)).rejects.toThrow(
      "Worker pool slot failed to restart.",
    );
    expect(workers[0]?.state).toBe("disposed");
    expect(pool.stats().slots).toBe(0);
    await expect(pool.health()).resolves.toMatchObject({
      status: "degraded",
      state: "failed",
    });
    expect(() => pool.run("must-not-run")).toThrow(
      "Worker pool has not been started.",
    );
    await pool.dispose();
  });
});

class FakeWorker implements SubscriptionWorker<string, string> {
  state: SubscriptionWorkerState = "created";
  prewarmed = false;
  failStart = false;
  startGate: Promise<void> | null = null;
  capacitySnapshot: WorkerCapacitySnapshot | null = null;
  healthError: Error | null = null;

  constructor(
    readonly workerId: string,
    private readonly handler: (job: string) => Promise<string> = async (job) =>
      `ok:${job}`,
  ) {}

  onDispose: (() => void) | null = null;
  onStart: (() => void) | null = null;

  async start(): Promise<void> {
    if (this.failStart) throw new Error("fake_start_failed");
    this.onStart?.();
    await this.startGate;
    this.state = "started";
  }

  async prewarm(): Promise<SubscriptionWorkerPrewarmResult> {
    this.prewarmed = true;
    this.state = "ready";
    return {
      status: "ready",
      warmedAt: new Date(),
      warnings: [],
    };
  }

  async run(job: string): Promise<string> {
    return this.handler(job);
  }

  async health() {
    if (this.healthError) throw this.healthError;
    return {
      status: "healthy" as const,
      state: this.state,
      checkedAt: new Date(),
      warnings: [],
    };
  }

  capacity(): WorkerCapacitySnapshot {
    return this.capacitySnapshot ?? { availability: "available" };
  }

  async dispose(): Promise<void> {
    this.state = "disposed";
    this.onDispose?.();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deferred<T>(): {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
} {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}
