import { readTargetRevision } from "@vioxen/subscription-runtime/worker-core";
import { LocalGitRevisionReader } from "../codex-goal-git-revision.js";
import { resolvePath, stringValue, } from "./codex-goal-input-values.js";
export async function targetCommitFromArgs(args) {
    const commit = stringValue(args.targetCommit);
    if (commit) {
        assertSafeGitCommitSha(commit);
        return commit;
    }
    const workspacePath = stringValue(args.targetWorkspacePath);
    if (!workspacePath)
        return undefined;
    const cwd = resolvePath(process.cwd(), args.cwd ?? process.cwd());
    const target = await readTargetRevision(new LocalGitRevisionReader(), {
        workspacePath: resolvePath(cwd, workspacePath),
    });
    return target.commit;
}
function assertSafeGitCommitSha(value) {
    if (!/^[0-9a-fA-F]{7,64}$/.test(value)) {
        throw new Error("project_control_commit_sha_invalid");
    }
}
export function optionalTargetCommit(targetCommit) {
    return targetCommit === undefined ? {} : { targetCommit };
}
//# sourceMappingURL=codex-goal-target-commit.js.map