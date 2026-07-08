/// <reference types="node" />
import type { CodexGoalJobBriefInput } from "./codex-goal-use-case-inputs.js";
export declare function targetCommitFromArgs(args: Pick<CodexGoalJobBriefInput, "cwd" | "targetCommit" | "targetWorkspacePath">): Promise<string | undefined>;
export declare function optionalTargetCommit(targetCommit: string | undefined): {
    readonly targetCommit?: string;
};
//# sourceMappingURL=codex-goal-target-commit.d.ts.map