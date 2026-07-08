import { hostname } from "node:os";
import { buildControlledAgentProcessOwner, } from "@vioxen/subscription-runtime/worker-core";
export function createInMemoryProjectControllerProviderRegistry() {
    const providers = new Map();
    return {
        get(sessionId) {
            return providers.get(sessionId);
        },
        set(sessionId, provider) {
            providers.set(sessionId, provider);
        },
        delete(sessionId) {
            providers.delete(sessionId);
        },
    };
}
export function projectControllerProcessOwner(runtimeVersion) {
    return buildControlledAgentProcessOwner({
        runtimeVersion,
        ...(process.env.SUBSCRIPTION_RUNTIME_RELEASE_SHA === undefined
            ? {}
            : { runtimeSha: process.env.SUBSCRIPTION_RUNTIME_RELEASE_SHA }),
        pid: process.pid,
    });
}
export function projectControllerOwnerIsLive(owner) {
    if (owner.hostname !== undefined && owner.hostname !== hostname())
        return true;
    if (owner.pid === undefined)
        return true;
    try {
        process.kill(owner.pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=codex-goal-project-controller-runtime.js.map