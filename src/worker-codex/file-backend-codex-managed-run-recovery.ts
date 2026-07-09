import type {
  ManagedRunRecord,
  ManagedRunRecoveryPacket,
  ProviderTask,
  ProviderTaskResult,
} from "@vioxen/subscription-runtime/core";

export type WaitingProviderTaskResult = Extract<
  ProviderTaskResult,
  { readonly status: "waiting_for_input" }
>;

type ManagedRunRecoveryJob = {
  readonly prompt: string;
  readonly systemPrompt?: string;
  readonly kind?: ProviderTask["kind"];
  readonly outputSchemaName?: string;
  readonly controls?: ProviderTask["controls"];
  readonly metadata?: Readonly<Record<string, string>>;
  readonly recoveryPacket?: ManagedRunRecoveryPacket;
};

type ManagedRunRecoveryResumeInput = {
  readonly runId: string;
  readonly requestId: string;
  readonly answer: string;
  readonly outputSchemaName?: string;
  readonly controls?: ProviderTask["controls"];
};

export type ManagedRunPersistContext =
  | {
      readonly kind: "run";
      readonly runId: string;
      readonly job: ManagedRunRecoveryJob;
      readonly attempt: number;
    }
  | {
      readonly kind: "resume";
      readonly input: ManagedRunRecoveryResumeInput;
      readonly previousRecord: ManagedRunRecord | null;
    };

export function canRecoverManagedRun(
  input: ManagedRunRecoveryResumeInput,
  record: ManagedRunRecord | null,
): record is ManagedRunRecord & {
  readonly recoveryPacket: ManagedRunRecoveryPacket;
} {
  if (!record?.recoveryPacket) return false;
  if (record.status === "completed" || record.status === "aborted") return false;
  if (record.runId !== input.runId) return false;
  if (record.request && record.request.id !== input.requestId) return false;
  if (record.resumeHandle?.runId && record.resumeHandle.runId !== input.runId) {
    return false;
  }
  return true;
}

export function buildManagedRunRecoveryPacket(input: {
  readonly result: WaitingProviderTaskResult;
  readonly context: ManagedRunPersistContext;
}): ManagedRunRecoveryPacket {
  const previous =
    input.context.kind === "resume"
      ? input.context.previousRecord?.recoveryPacket
      : input.context.job.recoveryPacket;
  const job = input.context.kind === "run" ? input.context.job : null;
  const controls =
    input.context.kind === "resume"
      ? input.context.input.controls ?? previous?.controls
      : job?.controls ?? previous?.controls;
  const outputSchemaName =
    input.context.kind === "resume"
      ? input.context.input.outputSchemaName ?? previous?.outputSchemaName
      : job?.outputSchemaName ?? previous?.outputSchemaName;
  const metadata =
    input.context.kind === "run"
      ? job?.metadata ?? previous?.metadata
      : previous?.metadata;
  const goalObjective =
    metadata?.codexGoalObjective ?? previous?.goalObjective;
  const kind = job?.kind ?? previous?.kind;
  const systemPrompt = job?.systemPrompt ?? previous?.systemPrompt;
  return {
    originalPrompt: previous?.originalPrompt ?? job?.prompt ?? input.result.outputText,
    ...(goalObjective ? { goalObjective } : {}),
    lastOutput: input.result.outputText,
    blockerQuestion: input.result.request.question,
    ...(input.result.request.contextSummary
      ? { contextSummary: input.result.request.contextSummary }
      : previous?.contextSummary
        ? { contextSummary: previous.contextSummary }
        : {}),
    attemptSummary: managedRunAttemptSummary(input.context),
    ...(kind ? { kind } : {}),
    ...(systemPrompt ? { systemPrompt } : {}),
    ...(outputSchemaName ? { outputSchemaName } : {}),
    ...(controls ? { controls } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function managedRunAttemptSummary(context: ManagedRunPersistContext): string {
  if (context.kind === "run") {
    return `Blocked during worker attempt ${context.attempt}.`;
  }
  const answerPreview = context.input.answer.trim().slice(0, 240);
  return [
    `Recovered after answering request ${context.input.requestId}.`,
    answerPreview ? `Answer preview: ${answerPreview}` : "Answer preview: (empty answer)",
  ].join("\n");
}

export function buildManagedRunRecoveryPrompt(input: {
  readonly packet: ManagedRunRecoveryPacket;
  readonly answer: string;
  readonly requestId: string;
}): string {
  return [
    "Continue a previously blocked managed run.",
    "",
    "Original task:",
    input.packet.originalPrompt,
    "",
    ...(input.packet.goalObjective
      ? ["Goal objective:", input.packet.goalObjective, ""]
      : []),
    "Last worker output before the blocker:",
    input.packet.lastOutput || "(no output)",
    "",
    "Blocking request:",
    `Request id: ${input.requestId}`,
    input.packet.blockerQuestion,
    "",
    ...(input.packet.contextSummary
      ? ["Context summary:", input.packet.contextSummary, ""]
      : []),
    ...(input.packet.attemptSummary
      ? ["Attempt summary:", input.packet.attemptSummary, ""]
      : []),
    "Answer from orchestrator:",
    input.answer.trim() || "(empty answer)",
    "",
    "Use the answer above and continue the original task from the recovered state. Do not restart from scratch unless the recovered context is insufficient.",
  ].join("\n");
}
