import { LaunchPlanStatus, } from "@vioxen/subscription-runtime/worker-core";
import { codexGoalJobToArgs, } from "./codex-goal-jobs.js";
import { goalLaunchInput, } from "./codex-goal-mcp-launch-input.js";
import { projectControllerOptionsFromMcpArgs, } from "./codex-goal-mcp-project-controller-profile.js";
import { projectControllerLaunchInput, projectControllerProfile, projectControllerState, } from "./application/project-control/codex-goal-project-controller-profile.js";
import { projectControllerProviderKind, } from "./application/project-control/codex-goal-project-controller-options.js";
import { projectControllerProvider, } from "./codex-goal-mcp-project-controller-provider.js";
import { projectControllerLaunchPlanViewJson, projectControllerReconcileDisconnectedViewJson, projectControllerReconcileProviderResultViewJson, projectControllerStartExistingRunViewJson, projectControllerStartLaunchBlockedViewJson, projectControllerStartReadyViewJson, projectControllerStartUseCaseBlockedViewJson, projectControllerStatusViewJson, projectControllerStopDisconnectedViewJson, projectControllerStopProviderResultViewJson, projectControllerViewBase, } from "./application/project-control/codex-goal-project-controller-view.js";
import { observeProjectControllerControlledRun, reconcileProjectControllerControlledRun, startProjectControllerControlledRun, stopProjectControllerControlledRun, } from "./application/project-control/codex-goal-project-controller-run-use-cases.js";
import { workerControlDecisionJson, } from "./application/codex-goal-worker-control-view.js";
import { codexGoalWorkerControlService, codexGoalWorkerControlTarget, } from "./application/codex-goal-worker-control.js";
export async function projectControllerLaunchPlanView(args, deps) {
    const controller = await deps.loadProjectControlController(args);
    const options = projectControllerOptionsFromMcpArgs(args);
    const state = projectControllerState(options, controller);
    const profile = projectControllerProfile(options, state);
    const plan = projectControllerLaunchInput(controller, state, profile);
    return projectControllerLaunchPlanViewJson({
        base: controllerViewBase(controller, state, profile.providerKind),
        rawShellMode: options.rawShellMode,
        profile,
        plan,
    });
}
export async function projectControllerStartView(args, deps) {
    const controller = await deps.loadProjectControlController(args);
    const options = projectControllerOptionsFromMcpArgs(args);
    const state = projectControllerState(options, controller);
    const profile = projectControllerProfile(options, state);
    const base = controllerViewBase(controller, state, profile.providerKind);
    const plan = projectControllerLaunchInput(controller, state, profile);
    if (plan.status === LaunchPlanStatus.Blocked) {
        return projectControllerStartLaunchBlockedViewJson({ base, plan });
    }
    const launch = await goalLaunchInput(codexGoalJobToArgs(controller.controller));
    const providerInput = await projectControllerProvider({
        options,
        controller,
        launch,
        profile,
        state,
    });
    const started = await startProjectControllerControlledRun({
        controllerJobId: controller.controller.jobId,
        scope: controller.scope,
        profile,
        state,
        launch,
        providerInput,
        deps,
    });
    if (!started.result.ok) {
        if ("reason" in started.result) {
            return projectControllerStartExistingRunViewJson({
                base,
                result: started.result,
            });
        }
        return projectControllerStartUseCaseBlockedViewJson({
            base,
            result: started.result,
        });
    }
    return projectControllerStartReadyViewJson({
        base,
        profile,
        plan,
        result: started.result,
        owner: started.owner,
        providerEvidence: started.providerEvidence,
    });
}
export async function projectControllerStatusView(args, deps) {
    const controller = await deps.loadProjectControlController(args);
    const options = projectControllerOptionsFromMcpArgs(args);
    const state = projectControllerState(options, controller);
    const observed = await observeProjectControllerControlledRun({ state, deps });
    return projectControllerStatusViewJson({
        base: controllerViewBase(controller, state, projectControllerProviderKind(options)),
        result: observed.result,
        providerAttached: observed.providerAttached,
        observed: observed.observed,
        providerStatusError: observed.providerStatusError,
        owner: observed.owner,
    });
}
export async function projectControllerConsumeGuidanceView(args, deps) {
    const controller = await deps.loadProjectControlController(args);
    const options = projectControllerOptionsFromMcpArgs(args);
    const launch = await goalLaunchInput(codexGoalJobToArgs(controller.controller));
    const control = codexGoalWorkerControlService(launch);
    const target = codexGoalWorkerControlTarget({
        manifest: controller.controller,
        launch,
    });
    const deliveryAttemptId = options.deliveryAttemptId ??
        `${controller.controller.jobId}:controller-guidance:${new Date().toISOString()}`;
    const batch = await control.consumeForContinuation({
        target,
        deliveryAttemptId,
    });
    const decision = await control.getDecision({ target });
    return {
        ok: true,
        mode: "project_controller_consume_guidance",
        controllerJobId: controller.controller.jobId,
        registryRootDir: controller.registryRootDir,
        deliveryAttemptId: batch.deliveryAttemptId,
        consumedCount: batch.signalIds.length,
        signalIds: batch.signalIds,
        ...(batch.message === undefined ? {} : { message: batch.message }),
        decision: workerControlDecisionJson(decision, false),
    };
}
export async function projectControllerStopView(args, deps) {
    const controller = await deps.loadProjectControlController(args);
    const options = projectControllerOptionsFromMcpArgs(args);
    const state = projectControllerState(options, controller);
    const base = controllerViewBase(controller, state, projectControllerProviderKind(options));
    const stopped = await stopProjectControllerControlledRun({
        state,
        reason: options.reason ?? "project_controller_stop",
        deps,
    });
    if (stopped.stopped !== undefined) {
        return projectControllerStopProviderResultViewJson({
            base,
            statusResult: stopped.statusResult,
            stopped: stopped.stopped,
            owner: stopped.owner,
        });
    }
    return projectControllerStopDisconnectedViewJson({
        base,
        result: stopped.result,
        owner: stopped.owner,
    });
}
export async function projectControllerReconcileView(args, deps) {
    const controller = await deps.loadProjectControlController(args);
    const options = projectControllerOptionsFromMcpArgs(args);
    const state = projectControllerState(options, controller);
    const base = controllerViewBase(controller, state, projectControllerProviderKind(options));
    const reconciled = await reconcileProjectControllerControlledRun({
        controllerJobId: controller.controller.jobId,
        state,
        loadLaunch: () => goalLaunchInput(codexGoalJobToArgs(controller.controller)),
        deps,
    });
    if (reconciled.reconciled !== undefined) {
        return projectControllerReconcileProviderResultViewJson({
            base,
            reconciled: reconciled.reconciled,
            owner: reconciled.owner,
        });
    }
    return projectControllerReconcileDisconnectedViewJson({
        base,
        result: reconciled.result,
        owner: reconciled.owner,
    });
}
function controllerViewBase(controller, state, providerKind) {
    return projectControllerViewBase({
        controllerJobId: controller.controller.jobId,
        providerKind,
        registryRootDir: controller.registryRootDir,
        stateDir: state.stateDir,
        sessionId: state.sessionId,
    });
}
//# sourceMappingURL=codex-goal-mcp-project-controller.js.map