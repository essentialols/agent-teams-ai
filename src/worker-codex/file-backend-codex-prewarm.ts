import type {
  RedactorPort,
  RunnerPort,
  SessionArtifact,
  SessionStorePort,
  WorkspacePort,
} from "@vioxen/subscription-runtime/core";
import type { CodexSessionPrewarmResult } from "@vioxen/subscription-runtime/provider-codex";
import {
  SubscriptionWorkerError,
  type SubscriptionWorkerPrewarmResult,
} from "@vioxen/subscription-runtime/worker-core";

type PrewarmCapableCodexAgentDriver = {
  prewarmSession(input: {
    readonly session: SessionArtifact;
    readonly redactor: RedactorPort;
    readonly workspacePath?: string;
    readonly runner?: RunnerPort;
    readonly abortSignal?: AbortSignal;
  }): Promise<CodexSessionPrewarmResult>;
};

export type FileBackendCodexPrewarmerOptions = {
  readonly providerInstanceId: string;
  readonly sessionStore: SessionStorePort;
  readonly agentDriver: object;
  readonly prewarmWorkspace: WorkspacePort;
  readonly runner: RunnerPort;
  readonly redactor: RedactorPort;
  readonly now: () => Date;
  readonly importAuthJsonFileIfChanged: (
    context: "prewarm" | "run",
  ) => Promise<void>;
  readonly exportAuthJsonFileQuietly: (
    context: "prewarm" | "run",
  ) => Promise<void>;
  readonly rememberQuotaGroup: (session: SessionArtifact) => void;
};

export class FileBackendCodexPrewarmer {
  constructor(private readonly options: FileBackendCodexPrewarmerOptions) {}

  async prewarm(): Promise<SubscriptionWorkerPrewarmResult> {
    await this.options.importAuthJsonFileIfChanged("prewarm");
    const session = await this.options.sessionStore.read({
      providerInstanceId: this.options.providerInstanceId,
      expectedProviderId: "codex",
      purpose: "run",
    });
    if (!session) {
      throw new SubscriptionWorkerError(
        "subscription_worker_prewarm_failed",
        "Codex session is missing.",
      );
    }
    this.options.rememberQuotaGroup(session.artifact);

    if (!hasPrewarmSession(this.options.agentDriver)) {
      try {
        return {
          status: "skipped",
          warmedAt: this.options.now(),
          warnings: [],
          details: {
            engine: "plain-exec",
            engineReusable: "false",
          },
        };
      } finally {
        await this.options.exportAuthJsonFileQuietly("prewarm");
      }
    }

    const workspace = await this.options.prewarmWorkspace.create({
      purpose: "run-task",
      isolation: "temp-dir",
    });
    try {
      const result = await this.options.agentDriver.prewarmSession({
        session: session.artifact,
        redactor: this.options.redactor,
        workspacePath: workspace.path,
        runner: this.options.runner,
        abortSignal: new AbortController().signal,
      });
      return {
        status: result.reusable ? "ready" : "skipped",
        warmedAt: result.warmedAt,
        warnings: result.warnings ?? [],
        details: {
          mode: result.mode,
          reusable: String(result.reusable),
          ...(result.engine
            ? {
                engine: result.engine.kind,
                engineReusable: String(result.engine.reusable),
              }
            : {}),
        },
      };
    } finally {
      await workspace.dispose?.();
      await this.options.exportAuthJsonFileQuietly("prewarm");
    }
  }
}

function hasPrewarmSession(
  agentDriver: object,
): agentDriver is PrewarmCapableCodexAgentDriver {
  return "prewarmSession" in agentDriver;
}
