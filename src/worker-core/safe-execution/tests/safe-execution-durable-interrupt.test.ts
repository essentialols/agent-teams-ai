import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  InMemoryAttemptJournal,
  InMemoryWorkspaceLockStore,
  SafeExecutionRunner,
  WorkerControlService,
} from "../../index";
import {
  DefaultWorkspaceSnapshotter,
  NodeSafeExecutionRuntime,
  NodeSafeExecutionWorkspaceAccess,
} from "../../../worker-local/safe-execution";
import {
  cleanupTemporaryPaths,
  deferred,
  gitWorkspace,
  InMemoryWorkerControlInboxStore,
  sequentialIds,
  type PromptJob,
  type PromptResult,
} from "./safe-execution-test-support";

describe("SafeExecutionRunner durable interrupt", () => {
  const cleanupPaths: string[] = [];

  afterEach(async () => {
    await cleanupTemporaryPaths(cleanupPaths);
  });

  it("interrupts from a cross-process signal and continues the same task", async () => {
    const workspacePath = await gitWorkspace(
      cleanupPaths,
      "safe-execution-durable-interrupt-",
    );
    const store = new InMemoryWorkerControlInboxStore();
    const workerControl = new WorkerControlService({
      store,
      idFactory: sequentialIds("worker-control"),
    });
    const remoteControl = new WorkerControlService({
      store,
      idFactory: sequentialIds("remote-control"),
    });
    const target = {
      jobId: "job-durable-interrupt",
      taskId: "task-durable-interrupt",
      workspaceId: workspacePath,
    };
    const firstAttemptStarted = deferred<void>();
    let runs = 0;
    const pool = {
      async run(
        job: PromptJob,
        options?: { readonly abortSignal?: AbortSignal },
      ): Promise<PromptResult> {
        runs += 1;
        if (runs === 1) {
          await writeFile(join(job.workspacePath, "feature.txt"), "partial\n");
          firstAttemptStarted.resolve();
          await new Promise<never>((_resolve, reject) => {
            const abortSignal = options?.abortSignal;
            if (abortSignal?.aborted) {
              reject(new Error("provider observed durable runtime abort"));
              return;
            }
            abortSignal?.addEventListener(
              "abort",
              () =>
                reject(new Error("provider observed durable runtime abort")),
              { once: true },
            );
          });
        }
        expect(job.prompt).toContain(
          "Previous attempt stopped because: runtime_interrupted",
        );
        expect(job.prompt).toContain("Runtime control inbox instructions");
        expect(job.prompt).toContain("Focus only on the delivery cleanup fix.");
        expect(await readFile(join(workspacePath, "feature.txt"), "utf8")).toBe(
          "partial\n",
        );
        await writeFile(join(workspacePath, "feature.txt"), "done\n");
        return { output: "continued after durable interrupt" };
      },
    };
    const runner = new SafeExecutionRunner({
      snapshotter: new DefaultWorkspaceSnapshotter(),
      workspaceAccess: new NodeSafeExecutionWorkspaceAccess(),
      runtime: new NodeSafeExecutionRuntime(),
      lockStore: new InMemoryWorkspaceLockStore(),
      journal: new InMemoryAttemptJournal(),
      controlInbox: workerControl,
      controlInterruptSource: workerControl,
      controlInterruptPollIntervalMs: 5,
    });

    const run = runner.run({
      taskId: "task-durable-interrupt",
      workspace: { mode: "existing_locked", path: workspacePath },
      effectMode: "workspace_patch",
      provider: "codex",
      pool,
      job: { prompt: "Fix delivery cleanup.", workspacePath },
      originalPrompt: "Fix delivery cleanup.",
      controlTarget: target,
      policy: { maxAttempts: 2 },
    });
    await firstAttemptStarted.promise;
    const signal = await remoteControl.enqueueSignal({
      target,
      intent: "guidance",
      deliveryMode: "interrupt_then_continue",
      body: "Focus only on the delivery cleanup fix.",
      caller: { kind: "orchestrator" },
      priority: "high",
      idempotencyKey: "durable-cross-process-guidance",
    });

    const result = await run;
    if (result.status !== "completed") throw new Error("expected completed");
    expect(runs).toBe(2);
    expect(result.attempts[0]?.failureReason).toBe("runtime_interrupted");
    expect(await readFile(join(workspacePath, "feature.txt"), "utf8")).toBe(
      "done\n",
    );
    const signals = await workerControl.listSignals({
      target,
      includeExpired: true,
    });
    expect(
      signals.find((view) => view.signal.signalId === signal.signalId)?.state,
    ).toBe("delivered");
  });

  it("does not delay provider completion when the control inbox read hangs", async () => {
    const workspacePath = await gitWorkspace(
      cleanupPaths,
      "safe-execution-hung-control-read-",
    );
    const runner = new SafeExecutionRunner({
      snapshotter: new DefaultWorkspaceSnapshotter(),
      workspaceAccess: new NodeSafeExecutionWorkspaceAccess(),
      runtime: new NodeSafeExecutionRuntime(),
      lockStore: new InMemoryWorkspaceLockStore(),
      journal: new InMemoryAttemptJournal(),
      controlInterruptSource: {
        claimPendingInterrupt: async () => await new Promise<never>(() => {}),
        deliverClaimedInterrupt: async () => {
          throw new Error("unexpected interrupt delivery");
        },
        releaseClaimedInterrupt: async () => false,
      },
      controlInterruptPollIntervalMs: 5,
    });

    const result = await withTimeout(
      runner.run({
        taskId: "task-hung-control-read",
        workspace: { mode: "existing_locked", path: workspacePath },
        effectMode: "workspace_patch",
        provider: "codex",
        pool: {
          run: async () => ({ output: "provider completed" }),
        },
        job: { prompt: "Complete normally.", workspacePath },
        originalPrompt: "Complete normally.",
        controlTarget: { jobId: "job-hung-control-read" },
        policy: { maxAttempts: 1 },
      }),
      250,
    );

    expect(result.status).toBe("completed");
  });
});

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("operation_timed_out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
