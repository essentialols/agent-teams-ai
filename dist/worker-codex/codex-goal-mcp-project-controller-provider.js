import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sessionArtifactFromCodexAuthJson } from "@vioxen/subscription-runtime/provider-codex";
import { createLocalClaudeControlledAgentProvider, loadScopedClaudeSessionArtifact, } from "@vioxen/subscription-runtime/worker-local";
import { RunEventProviderKind, } from "@vioxen/subscription-runtime/worker-core";
import { CodexControlledAgentProvider } from "./controlled-agent/index.js";
import { selectProjectControllerCodexAccountSlot, } from "./application/project-control/codex-goal-project-controller-account-selection.js";
import { projectControllerPendingGuidancePromptContext, } from "./application/project-control/codex-goal-project-controller-guidance.js";
import { codexGoalStateRootDir, codexGoalWorkerControlService, codexGoalWorkerControlTarget, } from "./codex-goal-mcp-worker-control.js";
import { listCodexGoalAccountStatuses } from "./codex-goal-ops.js";
export async function projectControllerProvider(input) {
    if (input.profile.providerKind === RunEventProviderKind.Claude) {
        const loaded = await controlledAgentClaudeSessionArtifact(input);
        const controllerObjective = await projectControllerObjectiveWithPendingGuidance(input.controller, input.launch);
        return {
            provider: createLocalClaudeControlledAgentProvider({
                profile: input.profile,
                sessionArtifact: loaded.sessionArtifact,
                workspacePath: input.launch.config.workspacePath,
                ...(input.options.claudePath === undefined
                    ? {}
                    : { claudePath: input.options.claudePath }),
                ...(input.launch.config.model === undefined
                    ? {}
                    : { model: input.launch.config.model }),
                ...(input.options.maxGoalTurns === undefined
                    ? {}
                    : { maxTurns: input.options.maxGoalTurns }),
                controllerObjective,
            }),
            sessionArtifact: {
                path: loaded.path,
                sha256Prefix: loaded.sha256Prefix,
            },
            safeMessage: "Claude broker-only controlled-agent provider started with strict MCP broker tools.",
        };
    }
    const account = await controlledAgentCodexAccount({
        controller: input.controller,
        launch: input.launch,
    });
    const controllerObjective = await projectControllerObjectiveWithPendingGuidance(input.controller, input.launch);
    return {
        provider: new CodexControlledAgentProvider({
            profile: input.profile,
            sessionArtifact: account.sessionArtifact,
            workspacePath: input.launch.config.workspacePath,
            codexBinaryPath: input.launch.config.codexBinaryPath ?? "codex",
            controllerObjective,
            ...(input.launch.config.model === undefined
                ? {}
                : { model: input.launch.config.model }),
            ...(input.launch.config.reasoningEffort === undefined
                ? {}
                : { reasoningEffort: input.launch.config.reasoningEffort }),
            ...(input.launch.config.serviceTier === undefined
                ? {}
                : { serviceTier: input.launch.config.serviceTier }),
            ...(input.options.maxGoalTurns === undefined
                ? {}
                : { maxGoalTurns: input.options.maxGoalTurns }),
        }),
        account: {
            name: account.name,
            ...(account.authJsonSha256Prefix === undefined
                ? {}
                : { authJsonSha256Prefix: account.authJsonSha256Prefix }),
        },
        safeMessage: "Codex broker-only controlled-agent provider started with native app-server environments disabled.",
    };
}
async function projectControllerObjectiveWithPendingGuidance(controller, launch) {
    const baseObjective = await readFile(launch.config.promptPath, "utf8");
    const guidanceContext = await projectControllerPendingGuidanceContext(controller, launch);
    return guidanceContext === undefined
        ? baseObjective
        : `${baseObjective}\n\n${guidanceContext}`;
}
async function projectControllerPendingGuidanceContext(controller, launch) {
    try {
        const control = codexGoalWorkerControlService(launch);
        const target = codexGoalWorkerControlTarget({
            manifest: controller.controller,
            launch,
        });
        const decision = await control.getDecision({ target });
        return projectControllerPendingGuidancePromptContext({
            pendingCount: decision.pendingSignals.length,
            deliverableSignals: decision.deliverableSignals,
        });
    }
    catch {
        return undefined;
    }
}
async function controlledAgentCodexAccount(input) {
    if (!input.controller.scope.authRoot) {
        throw new Error("project_control_controller_auth_root_scope_required");
    }
    if (resolve(input.launch.config.authRootDir) !== resolve(input.controller.scope.authRoot)) {
        throw new Error("project_control_controller_auth_root_outside_scope");
    }
    const slots = await listCodexGoalAccountStatuses({
        authRootDir: input.launch.config.authRootDir,
        accounts: input.launch.config.accounts.map((account) => account.name),
        stateRootDir: codexGoalStateRootDir(input.launch),
    });
    const selected = selectProjectControllerCodexAccountSlot({
        slots,
        allowedAccountIds: input.controller.scope.allowedAccountIds,
    });
    if (!selected) {
        throw new Error("project_control_controller_no_available_account");
    }
    const authJsonBytes = await readFile(selected.authJsonPath, "utf8");
    return {
        name: selected.name,
        ...(selected.authJsonSha256Prefix === undefined
            ? {}
            : { authJsonSha256Prefix: selected.authJsonSha256Prefix }),
        sessionArtifact: sessionArtifactFromCodexAuthJson(authJsonBytes),
    };
}
async function controlledAgentClaudeSessionArtifact(input) {
    if (!input.controller.scope.authRoot) {
        throw new Error("project_control_controller_auth_root_scope_required");
    }
    const rawPath = input.options.sessionArtifactPath;
    if (rawPath === undefined) {
        throw new Error("project_control_controller_session_artifact_path_required");
    }
    return loadScopedClaudeSessionArtifact({
        sessionArtifactPath: rawPath,
        authRoot: input.controller.scope.authRoot,
        cwd: input.state.cwd,
    });
}
//# sourceMappingURL=codex-goal-mcp-project-controller-provider.js.map