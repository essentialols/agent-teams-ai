/// <reference types="node" />
import { type CodexGoalLaunchInput, type CodexGoalStatus } from "../codex-goal-ops.js";
type JsonObject = Readonly<Record<string, unknown>>;
export declare function dryRunCodexGoalLaunch(input: {
    readonly launch: CodexGoalLaunchInput;
}): JsonObject;
export declare function startCodexGoalLaunch(input: {
    readonly launch: CodexGoalLaunchInput;
    readonly registryRootDir: string;
    readonly jobId: string;
    readonly confirmStart: boolean;
    readonly skipDoctor: boolean;
    readonly forceStart: boolean;
}): Promise<JsonObject>;
export declare function inspectCodexGoalStatus(input: {
    readonly cwd: string | undefined;
    readonly jobRootDir: string | undefined;
    readonly taskId: string | undefined;
    readonly workspacePath: string | undefined;
    readonly tmuxSession: string | undefined;
    readonly logPath: string | undefined;
    readonly progressPath: string | undefined;
}): Promise<CodexGoalStatus>;
export declare function inspectCodexGoalDoctor(input: {
    readonly launch: CodexGoalLaunchInput;
}): Promise<JsonObject>;
export declare function tailCodexGoalRunLog(input: {
    readonly cwd: string | undefined;
    readonly jobRootDir: string | undefined;
    readonly taskId: string | undefined;
    readonly logPath: string | undefined;
    readonly lines: number | undefined;
}): Promise<JsonObject>;
export {};
//# sourceMappingURL=codex-goal-operation-use-cases.d.ts.map