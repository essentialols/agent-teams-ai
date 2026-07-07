/// <reference types="node" />
import type { ProjectAccessScope } from "@vioxen/subscription-runtime/worker-core";
import type { CodexGoalJobManifestInput } from "./codex-goal-jobs.js";
import type { DependencyBootstrapMode, DependencyPreflightResult } from "./dependency-bootstrap.js";
import type { ProjectControlMcpArgs } from "./codex-goal-mcp-inputs.js";
export declare function projectControlChildScope(parent: ProjectAccessScope, workspacePath: string): ProjectAccessScope;
export declare function assertProjectControlScopeRepairAllowed(input: {
    readonly existing: ProjectAccessScope;
    readonly proposed: ProjectAccessScope;
}): void;
export declare function projectScopeFieldFingerprint(value: unknown): string;
export declare function projectControlWorkerRole(value: unknown): "producer" | "fastgate" | "reviewer";
export declare function projectControlDependencyBootstrapMode(value: unknown): DependencyBootstrapMode;
export declare function assertProjectControlDependencyBootstrapReady(result: DependencyPreflightResult): void;
export declare function assertProjectControlCreateManifestPaths(input: {
    readonly scope: ProjectAccessScope;
    readonly registryRootDir: string;
    readonly manifest: CodexGoalJobManifestInput;
}): void;
export declare function projectControlRealPathOutsideWorkspaceScope(path: string, scope: ProjectAccessScope): Promise<string | undefined>;
export declare function projectControlPathArg(args: ProjectControlMcpArgs, value: unknown, fieldName: string): string;
//# sourceMappingURL=codex-goal-mcp-project-scope.d.ts.map