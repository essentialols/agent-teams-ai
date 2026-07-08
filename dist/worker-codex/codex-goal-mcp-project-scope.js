import { basename, dirname, resolve } from "node:path";
export { projectControlRealPathOutsideWorkspaceScope } from "./application/project-control/codex-goal-project-workspace-scope.js";
import { matchesProjectControlPrefix, pathInsideAnyProjectRoot, pathInsideOrEqual, uniqueProjectControlStrings, } from "./codex-goal-mcp-project-utils.js";
import { requiredString, resolvePath, stringValue, } from "./codex-goal-mcp-values.js";
const PROJECT_CONTROL_SCOPE_REPAIR_IMMUTABLE_FIELDS = [
    "projectId",
    "projectSlug",
    "readRoots",
    "observedWorkspaceRoots",
    "isolatedWorkspaceRoot",
    "workspaceRoots",
    "worktreeRoots",
    "registryRoot",
    "authRoot",
    "deniedRoots",
    "jobIdPrefixes",
    "tmuxSessionPrefixes",
    "allowedBranches",
    "allowedGitRemotes",
    "allowedAccountIds",
    "allowForcePush",
];
export function projectControlChildScope(parent, workspacePath) {
    return {
        projectId: parent.projectId,
        ...(parent.projectSlug ? { projectSlug: parent.projectSlug } : {}),
        readRoots: uniqueProjectControlStrings([
            ...(parent.readRoots ?? []),
            workspacePath,
            ...(parent.registryRoot ? [parent.registryRoot] : []),
        ]),
        isolatedWorkspaceRoot: workspacePath,
        workspaceRoots: [workspacePath],
        ...(parent.registryRoot ? { registryRoot: parent.registryRoot } : {}),
        ...(parent.authRoot ? { authRoot: parent.authRoot } : {}),
        ...(parent.deniedRoots ? { deniedRoots: parent.deniedRoots } : {}),
        ...(parent.allowedAccountIds
            ? { allowedAccountIds: parent.allowedAccountIds }
            : {}),
    };
}
export function assertProjectControlScopeRepairAllowed(input) {
    for (const field of PROJECT_CONTROL_SCOPE_REPAIR_IMMUTABLE_FIELDS) {
        if (projectScopeFieldFingerprint(input.existing[field]) !==
            projectScopeFieldFingerprint(input.proposed[field])) {
            throw new Error(`project_control_scope_${field}_repair_denied`);
        }
    }
    const allowedRoots = uniqueProjectControlStrings([
        ...(input.existing.readRoots ?? []),
        ...(input.existing.workspaceRoots ?? []),
        ...(input.existing.worktreeRoots ?? []),
        ...(input.existing.isolatedWorkspaceRoot
            ? [input.existing.isolatedWorkspaceRoot]
            : []),
        ...(input.existing.registryRoot ? [input.existing.registryRoot] : []),
    ]);
    const deniedRoots = input.existing.deniedRoots ?? [];
    for (const root of input.proposed.consumedOutputLedgerRoots ?? []) {
        if (!pathInsideAnyProjectRoot(root, allowedRoots)) {
            throw new Error("project_control_consumed_output_ledger_root_outside_scope");
        }
        if (pathInsideAnyProjectRoot(root, deniedRoots)) {
            throw new Error("project_control_consumed_output_ledger_root_denied");
        }
    }
}
export function projectScopeFieldFingerprint(value) {
    if (Array.isArray(value)) {
        return JSON.stringify(value.map((item) => String(item)));
    }
    return JSON.stringify(value ?? null);
}
export function projectControlWorkerRole(value) {
    const role = stringValue(value) ?? "producer";
    if (role === "producer" || role === "fastgate" || role === "reviewer") {
        return role;
    }
    throw new Error("project_control_worker_role_invalid");
}
export function projectControlDependencyBootstrapMode(value) {
    const mode = stringValue(value) ?? "preflight";
    if (mode === "off" || mode === "preflight" || mode === "install") {
        return mode;
    }
    throw new Error("project_control_dependency_bootstrap_mode_invalid");
}
export function assertProjectControlDependencyBootstrapReady(result) {
    if (result.mode === "install" && result.status === "install_failed") {
        throw new Error(`project_control_dependency_bootstrap_failed:${result.warnings.join(",")}`);
    }
}
export function assertProjectControlCreateManifestPaths(input) {
    const jobRootBase = dirname(input.scope.registryRoot ?? input.registryRootDir);
    if (!pathInsideOrEqual(input.manifest.jobRootDir, jobRootBase)) {
        throw new Error("project_control_job_root_outside_scope");
    }
    if (!matchesProjectControlPrefix(basename(input.manifest.jobRootDir), input.scope.jobIdPrefixes ?? [])) {
        throw new Error("project_control_job_root_prefix_denied");
    }
    if (!pathInsideAnyProjectRoot(input.manifest.workspacePath, [
        ...(input.scope.workspaceRoots ?? []),
        ...(input.scope.worktreeRoots ?? []),
        ...(input.scope.isolatedWorkspaceRoot ? [input.scope.isolatedWorkspaceRoot] : []),
    ])) {
        throw new Error("project_control_workspace_outside_scope");
    }
    for (const [field, value] of [
        ["promptPath", input.manifest.promptPath],
        ["outputPath", input.manifest.outputPath],
        ["progressPath", input.manifest.progressPath],
        ["logPath", input.manifest.logPath],
        ["stateRootDir", input.manifest.stateRootDir],
    ]) {
        if (value &&
            !pathInsideAnyProjectRoot(value, [
                input.manifest.jobRootDir,
                input.manifest.workspacePath,
            ])) {
            throw new Error(`project_control_${field}_outside_scope`);
        }
    }
    if (input.scope.authRoot &&
        input.manifest.authRootDir &&
        resolve(input.manifest.authRootDir) !== resolve(input.scope.authRoot)) {
        throw new Error("project_control_auth_root_outside_scope");
    }
}
export function projectControlPathArg(args, value, fieldName) {
    const cwd = resolvePath(process.cwd(), stringValue(args.cwd) ?? process.cwd());
    return requiredString(value, fieldName, cwd);
}
//# sourceMappingURL=codex-goal-mcp-project-scope.js.map