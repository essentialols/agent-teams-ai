import { DefaultRedactor } from "@vioxen/subscription-runtime/core";
import { AccessBoundary, NetworkAccessMode, getControlledAgentStatus, reconcileControlledAgentRun, startControlledAgentRun, stopControlledAgentRun, } from "@vioxen/subscription-runtime/worker-core";
import { projectControllerCapacityDemand, recordProjectControllerCapacitySignal, } from "../../project-controller-capacity.js";
import { codexGoalStateRootDir } from "../codex-goal-worker-control.js";
import { projectControllerOwnerIsLive, projectControllerProcessOwner, } from "./codex-goal-project-controller-runtime.js";
export async function startProjectControllerControlledRun(input) {
    const capacityAccountId = stringValue(input.providerInput.account?.name);
    const owner = projectControllerProcessOwner(input.deps.runtimeVersion);
    const result = await startControlledAgentRun({
        controllerJobId: input.controllerJobId,
        sessionId: input.state.sessionId,
        stateDir: input.state.stateDir,
        boundary: AccessBoundary.ProjectScopedControl,
        projectAccessScope: input.scope,
        provider: input.profile.enforcement,
        networkAccess: NetworkAccessMode.Restricted,
    }, {
        provider: input.providerInput.provider,
        stateStore: input.state.store,
        events: input.state.store,
        owner,
        ownerLiveness: { isLive: projectControllerOwnerIsLive },
        recoverOwnerlessActiveRunAfterMs: 10 * 60 * 1000,
        ...(capacityAccountId === undefined ? {} : {
            capacity: {
                accountId: capacityAccountId,
                demand: projectControllerCapacityDemand(input.launch.config),
            },
        }),
    });
    if (result.ok) {
        input.deps.providerRegistry.set(input.state.sessionId, input.providerInput.provider);
    }
    return {
        result,
        owner,
        providerEvidence: {
            ...(input.providerInput.account === undefined
                ? {}
                : { account: input.providerInput.account }),
            ...(input.providerInput.sessionArtifact === undefined
                ? {}
                : { sessionArtifact: input.providerInput.sessionArtifact }),
            safeMessage: input.providerInput.safeMessage,
        },
    };
}
export async function observeProjectControllerControlledRun(input) {
    const result = await getControlledAgentStatus(input.state.sessionId, {
        stateStore: input.state.store,
    });
    const provider = input.deps.providerRegistry.get(input.state.sessionId);
    let observed;
    let providerStatusError;
    if (result.ok && provider) {
        try {
            observed = await provider.status({ session: result.session, run: result.run });
        }
        catch (error) {
            providerStatusError = safeProjectControllerErrorMessage(error);
        }
    }
    return {
        result,
        providerAttached: provider !== undefined,
        ...(observed === undefined ? {} : { observed }),
        ...(providerStatusError === undefined ? {} : { providerStatusError }),
        owner: projectControllerProcessOwner(input.deps.runtimeVersion),
    };
}
export async function stopProjectControllerControlledRun(input) {
    const result = await getControlledAgentStatus(input.state.sessionId, {
        stateStore: input.state.store,
    });
    const provider = input.deps.providerRegistry.get(input.state.sessionId);
    const owner = projectControllerProcessOwner(input.deps.runtimeVersion);
    if (result.ok && provider) {
        const stopped = await stopControlledAgentRun({
            sessionId: input.state.sessionId,
            reason: input.reason,
        }, {
            stateStore: input.state.store,
            provider,
            events: input.state.store,
        });
        if (stopped.ok)
            input.deps.providerRegistry.delete(input.state.sessionId);
        return { statusResult: result, stopped, owner };
    }
    return { result, owner };
}
export async function reconcileProjectControllerControlledRun(input) {
    const result = await getControlledAgentStatus(input.state.sessionId, {
        stateStore: input.state.store,
    });
    const provider = input.deps.providerRegistry.get(input.state.sessionId);
    const owner = projectControllerProcessOwner(input.deps.runtimeVersion);
    if (result.ok && provider) {
        const reconciled = await reconcileControlledAgentRun(input.state.sessionId, {
            stateStore: input.state.store,
            provider,
            events: input.state.store,
        });
        if (reconciled.ok) {
            const launch = await input.loadLaunch();
            recordProjectControllerCapacitySignal({
                stateRootDir: codexGoalStateRootDir(launch),
                controllerJobId: input.controllerJobId,
                config: launch.config,
                run: reconciled.run,
            });
        }
        return { result, reconciled, owner };
    }
    return { result, owner };
}
function stringValue(value) {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
function safeProjectControllerErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    return new DefaultRedactor().redact(message);
}
//# sourceMappingURL=codex-goal-project-controller-run-use-cases.js.map