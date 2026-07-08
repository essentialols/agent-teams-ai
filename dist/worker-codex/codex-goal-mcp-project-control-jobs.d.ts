/// <reference types="node" />
import { type ProjectAccessScope, type ProjectControlBroker } from "@vioxen/subscription-runtime/worker-core";
import { type CodexGoalJobManifest } from "./codex-goal-jobs.js";
import { type CodexProjectControlBrokerInput } from "./codex-goal-mcp-project-broker.js";
import type { ProjectControlMcpArgs } from "./codex-goal-mcp-inputs.js";
type JsonObject = Readonly<Record<string, unknown>>;
type LoadedProjectControlController = {
    readonly registryRootDir: string;
    readonly controller: CodexGoalJobManifest;
    readonly scope: ProjectAccessScope;
};
export type CodexGoalMcpProjectControlJobsDeps = {
    readonly loadProjectControlController: (args: ProjectControlMcpArgs) => Promise<LoadedProjectControlController>;
    readonly codexProjectControlBroker: (input: Omit<CodexProjectControlBrokerInput, "admissionDeps">) => ProjectControlBroker;
};
export declare function projectControlCreateCodexGoalJobView(args: ProjectControlMcpArgs, deps: CodexGoalMcpProjectControlJobsDeps): Promise<JsonObject>;
export declare function projectControlRefillWorkerView(args: ProjectControlMcpArgs, deps: CodexGoalMcpProjectControlJobsDeps): Promise<JsonObject>;
export declare function projectControlOperationStatusView(args: ProjectControlMcpArgs, deps: CodexGoalMcpProjectControlJobsDeps): Promise<JsonObject>;
export {};
//# sourceMappingURL=codex-goal-mcp-project-control-jobs.d.ts.map