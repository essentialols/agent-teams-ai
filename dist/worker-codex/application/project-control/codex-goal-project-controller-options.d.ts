/// <reference types="node" />
import { RunEventProviderKind } from "@vioxen/subscription-runtime/worker-core";
export type ProjectControllerProviderKind = RunEventProviderKind.Codex | RunEventProviderKind.Claude;
export type ProjectControllerOptions = {
    readonly cwd: string;
    readonly providerKind?: string;
    readonly stateDir?: string;
    readonly sessionArtifactPath?: string;
    readonly claudePath?: string;
    readonly mcpServerName?: string;
    readonly mcpCommand?: string;
    readonly mcpArgs?: readonly string[];
    readonly mcpCwd?: string;
    readonly rawShellMode?: "disabled-by-provider" | "sandboxed-deny-rules-only";
    readonly maxGoalTurns?: number;
    readonly reason?: string;
    readonly deliveryAttemptId?: string;
};
export declare function projectControllerProviderKind(options: Pick<ProjectControllerOptions, "providerKind">): ProjectControllerProviderKind;
//# sourceMappingURL=codex-goal-project-controller-options.d.ts.map