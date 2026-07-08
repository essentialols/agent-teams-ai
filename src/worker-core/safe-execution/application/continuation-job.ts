import type { ContinuationPacket } from "../domain/safe-execution-task";
import type { SafeExecutionRunInput } from "./safe-execution-runner-contracts";

export function promptContinuationJobFactory<
  Job extends { readonly prompt: string },
>(input: {
  readonly job: Job;
  readonly continuationPacket: ContinuationPacket;
}): Job {
  return {
    ...input.job,
    prompt: input.continuationPacket.message,
  };
}

export function continuationJobFor<Job>(input: {
  readonly factory:
    | SafeExecutionRunInput<Job, unknown>["continuationJobFactory"]
    | undefined;
  readonly job: Job;
  readonly continuationPacket: ContinuationPacket;
  readonly attemptNumber: number;
}): Job | null {
  if (input.factory) {
    return input.factory({
      job: input.job,
      continuationPacket: input.continuationPacket,
      attemptNumber: input.attemptNumber,
    });
  }
  if (
    typeof input.job === "object" &&
    input.job !== null &&
    "prompt" in input.job &&
    typeof input.job.prompt === "string"
  ) {
    return promptContinuationJobFactory({
      job: input.job as { readonly prompt: string },
      continuationPacket: input.continuationPacket,
    }) as Job;
  }
  return null;
}
