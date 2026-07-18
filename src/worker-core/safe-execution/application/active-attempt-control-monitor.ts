import type {
  ClaimedWorkerControlInterrupt,
  WorkerControlContinuationBatch,
  WorkerControlInterruptSource,
  WorkerControlTarget,
} from "../../control";

const defaultPollIntervalMs = 1_000;

export type ActiveAttemptControlMonitor = {
  deliverForContinuation(input: {
    readonly deliveryAttemptId: string;
    readonly now: Date;
  }): Promise<WorkerControlContinuationBatch | undefined>;
  stop(): Promise<void>;
};

export function startActiveAttemptControlMonitor(input: {
  readonly source: WorkerControlInterruptSource;
  readonly target: WorkerControlTarget;
  readonly attemptAbortController: AbortController;
  readonly interruptDeliveryAttemptId: string;
  readonly pollIntervalMs?: number;
  readonly now: () => Date;
}): ActiveAttemptControlMonitor {
  const pollIntervalMs = input.pollIntervalMs ?? defaultPollIntervalMs;
  if (!Number.isInteger(pollIntervalMs) || pollIntervalMs <= 0) {
    throw new Error("worker_control_interrupt_poll_interval_invalid");
  }
  const stopped = new AbortController();
  let claim: ClaimedWorkerControlInterrupt | null = null;
  let delivered = false;
  const completed = monitorActiveAttempt({
    ...input,
    pollIntervalMs,
    stopped: stopped.signal,
    onClaim(value) {
      claim = value;
    },
  });
  return {
    async deliverForContinuation({
      deliveryAttemptId,
      now,
    }): Promise<WorkerControlContinuationBatch | undefined> {
      if (!claim) return undefined;
      const batch = await input.source.deliverClaimedInterrupt({
        claim,
        deliveryAttemptId,
        now,
      });
      delivered = true;
      return batch;
    },
    async stop(): Promise<void> {
      stopped.abort();
      await completed;
      if (claim && !delivered) {
        void input.source.releaseClaimedInterrupt({ claim }).catch(() => {});
      }
    },
  };
}

async function monitorActiveAttempt(input: {
  readonly source: WorkerControlInterruptSource;
  readonly target: WorkerControlTarget;
  readonly attemptAbortController: AbortController;
  readonly interruptDeliveryAttemptId: string;
  readonly pollIntervalMs: number;
  readonly now: () => Date;
  readonly stopped: AbortSignal;
  readonly onClaim: (claim: ClaimedWorkerControlInterrupt) => void;
}): Promise<void> {
  while (
    !input.stopped.aborted &&
    !input.attemptAbortController.signal.aborted
  ) {
    try {
      const pendingClaim = input.source.claimPendingInterrupt({
        target: input.target,
        deliveryAttemptId: input.interruptDeliveryAttemptId,
        now: input.now(),
      });
      const outcome = await stopAware(pendingClaim, input.stopped);
      if (outcome.stopped) {
        void pendingClaim
          .then((lateClaim) =>
            lateClaim
              ? input.source.releaseClaimedInterrupt({ claim: lateClaim })
              : false,
          )
          .catch(() => {});
        return;
      }
      if (outcome.value) {
        input.onClaim(outcome.value);
        input.attemptAbortController.abort({
          code: "runtime_controlled_interrupt",
          safeMessage:
            "Runtime controlled interrupt requested by durable worker control inbox.",
          signalId: outcome.value.signal.signalId,
          requestedBy: outcome.value.signal.createdBy,
        });
        return;
      }
    } catch {
      // A transient inbox read failure must not fail the provider attempt.
      // Keep polling until the attempt ends or the monitor is stopped.
    }
    await waitForNextPoll(input.pollIntervalMs, input.stopped);
  }
}

async function stopAware<T>(
  operation: Promise<T>,
  stopped: AbortSignal,
): Promise<
  { readonly stopped: true } | { readonly stopped: false; readonly value: T }
> {
  if (stopped.aborted) return { stopped: true };
  return await new Promise((resolve, reject) => {
    const onStop = () => resolve({ stopped: true } as const);
    stopped.addEventListener("abort", onStop, { once: true });
    operation.then(
      (value) => {
        stopped.removeEventListener("abort", onStop);
        resolve({ stopped: false, value });
      },
      (error) => {
        stopped.removeEventListener("abort", onStop);
        reject(error);
      },
    );
  });
}

function waitForNextPoll(ms: number, stopped: AbortSignal): Promise<void> {
  if (stopped.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done(): void {
      clearTimeout(timer);
      stopped.removeEventListener("abort", done);
      resolve();
    }
    stopped.addEventListener("abort", done, { once: true });
  });
}
