/// <reference types="node" />
import { type ProjectAccessScope } from "@vioxen/subscription-runtime/worker-core";
import { type CodexGoalJobManifest } from "./codex-goal-jobs.js";
import { type ProjectControllerProviderRegistry } from "./application/project-control/codex-goal-project-controller-runtime.js";
import type { ProjectControllerLaunchPlanMcpArgs } from "./codex-goal-mcp-inputs.js";
type JsonObject = Readonly<Record<string, unknown>>;
type LoadedProjectControlController = {
    readonly registryRootDir: string;
    readonly controller: CodexGoalJobManifest;
    readonly scope: ProjectAccessScope;
};
export type CodexGoalMcpProjectControllerDeps = {
    readonly loadProjectControlController: (args: ProjectControllerLaunchPlanMcpArgs) => Promise<LoadedProjectControlController>;
    readonly runtimeVersion: string;
    readonly providerRegistry: ProjectControllerProviderRegistry;
};
export declare function projectControllerLaunchPlanView(args: ProjectControllerLaunchPlanMcpArgs, deps: CodexGoalMcpProjectControllerDeps): Promise<JsonObject>;
export declare function projectControllerStartView(args: ProjectControllerLaunchPlanMcpArgs, deps: CodexGoalMcpProjectControllerDeps): Promise<JsonObject>;
export declare function projectControllerStatusView(args: ProjectControllerLaunchPlanMcpArgs, deps: CodexGoalMcpProjectControllerDeps): Promise<JsonObject>;
export declare function projectControllerConsumeGuidanceView(args: ProjectControllerLaunchPlanMcpArgs, deps: CodexGoalMcpProjectControllerDeps): Promise<JsonObject>;
export declare function projectControllerStopView(args: ProjectControllerLaunchPlanMcpArgs, deps: CodexGoalMcpProjectControllerDeps): Promise<JsonObject>;
export declare function projectControllerReconcileView(args: ProjectControllerLaunchPlanMcpArgs, deps: CodexGoalMcpProjectControllerDeps): Promise<JsonObject>;
export {};
//# sourceMappingURL=codex-goal-mcp-project-controller.d.ts.map