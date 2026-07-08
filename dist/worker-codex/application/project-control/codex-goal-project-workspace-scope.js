import { optionalRealPathForAdmission } from "./codex-goal-project-admission.js";
import { pathInsideAnyProjectRoot, uniqueProjectControlStrings, } from "./codex-goal-project-utils.js";
export async function projectControlRealPathOutsideWorkspaceScope(path, scope) {
    const realPath = await optionalRealPathForAdmission(path);
    if (!realPath)
        return undefined;
    const roots = projectControlWorkspaceRoots(scope);
    const realRoots = (await Promise.all(roots.map((root) => optionalRealPathForAdmission(root)))).filter((root) => Boolean(root));
    const allowedRoots = uniqueProjectControlStrings([
        ...roots,
        ...realRoots,
    ]);
    return pathInsideAnyProjectRoot(realPath, allowedRoots) ? undefined : realPath;
}
function projectControlWorkspaceRoots(scope) {
    return uniqueProjectControlStrings([
        ...(scope.workspaceRoots ?? []),
        ...(scope.worktreeRoots ?? []),
        ...(scope.isolatedWorkspaceRoot ? [scope.isolatedWorkspaceRoot] : []),
    ]);
}
//# sourceMappingURL=codex-goal-project-workspace-scope.js.map