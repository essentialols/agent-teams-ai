/// <reference types="node" />
import type { GoalMcpArgs } from "./codex-goal-mcp-inputs.js";
import type { CodexGoalLaunchInput } from "./codex-goal-ops.js";
import { type CodexGoalRunConfig } from "./codex-goal-runner.js";
export declare const CODEX_GOAL_MCP_DEFAULT_TIMEOUT_MS: number;
type JsonObject = Readonly<Record<string, unknown>>;
export declare function goalLaunchInput(args: GoalMcpArgs): Promise<CodexGoalLaunchInput>;
export declare function goalControlModesFromRecord(value: JsonObject): Pick<CodexGoalRunConfig, "editMode" | "providerSandboxMode">;
export {};
//# sourceMappingURL=codex-goal-mcp-launch-input.d.ts.map