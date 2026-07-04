import type {
  ObservabilityPort,
  RunnerPort,
} from "@vioxen/subscription-runtime/core";
import {
  validateCommandAgainstPolicy,
  type CommandPolicy,
} from "@vioxen/subscription-runtime/worker-core";

export type CommandPolicyRunnerOptions = {
  readonly observability?: ObservabilityPort;
  readonly providerId?: string;
  readonly agentId?: string;
  readonly storeId?: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

export class CommandPolicyRunner implements RunnerPort {
  readonly runnerId: string;
  readonly capabilities: RunnerPort["capabilities"];

  constructor(
    private readonly inner: RunnerPort,
    private readonly policy: CommandPolicy,
    private readonly options: CommandPolicyRunnerOptions = {},
  ) {
    this.runnerId = `${inner.runnerId}:command-policy`;
    this.capabilities = inner.capabilities;
  }

  async run(input: Parameters<RunnerPort["run"]>[0]) {
    const decision = validateCommandAgainstPolicy({
      command: [input.command, ...input.args],
      policy: this.policy,
    });
    if (!decision.allowed) {
      this.options.observability?.emit({
        name: "command_policy.denied",
        ...(this.options.providerId === undefined
          ? {}
          : { providerId: this.options.providerId }),
        ...(this.options.agentId === undefined ? {} : { agentId: this.options.agentId }),
        ...(this.options.storeId === undefined ? {} : { storeId: this.options.storeId }),
        metadata: {
          ...this.options.metadata,
          reason: decision.reason,
          ...(decision.executableName === undefined
            ? {}
            : { executableName: decision.executableName }),
          runnerId: this.inner.runnerId,
        },
      });
      throw new Error(`command_policy_denied:${decision.reason}`);
    }
    return this.inner.run(input);
  }
}
