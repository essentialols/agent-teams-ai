import { RunEventProviderKind, isRunEventProviderKind, } from "@vioxen/subscription-runtime/worker-core";
export function projectControllerProviderKind(options) {
    const providerKind = options.providerKind ?? RunEventProviderKind.Codex;
    if (isRunEventProviderKind(providerKind) &&
        (providerKind === RunEventProviderKind.Codex ||
            providerKind === RunEventProviderKind.Claude)) {
        return providerKind;
    }
    throw new Error("project_controller_provider_kind_unsupported:" + providerKind);
}
//# sourceMappingURL=codex-goal-project-controller-options.js.map