/// <reference types="node" />
import type { CodexGoalInput } from "./codex-goal-use-case-inputs.js";
import type { CodexGoalLaunchInput } from "../codex-goal-ops.js";
import { type CodexGoalRunConfig } from "../codex-goal-runner.js";
export declare const CODEX_GOAL_DEFAULT_TIMEOUT_MS: number;
type JsonObject = Readonly<Record<string, unknown>>;
export declare function goalLaunchInput(args: CodexGoalInput): Promise<CodexGoalLaunchInput>;
export declare function goalControlModesFromRecord(value: JsonObject): Pick<CodexGoalRunConfig, "editMode" | "providerSandboxMode">;
export {};
//# sourceMappingURL=codex-goal-launch-input.d.ts.map