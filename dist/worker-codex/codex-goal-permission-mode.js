export const codexGoalPermissionModes = [
    "read-only",
    "preapproved",
    "allow-edits",
    "bypass",
    "none",
];
const codexGoalPermissionModeSet = new Set(codexGoalPermissionModes);
export function parseCodexGoalPermissionMode(value, fieldName = "permissionMode") {
    if (codexGoalPermissionModeSet.has(value)) {
        return value;
    }
    throw new Error(codexGoalPermissionModeError(value, fieldName));
}
export function optionalCodexGoalPermissionMode(value, fieldName = "permissionMode") {
    return value === undefined
        ? undefined
        : parseCodexGoalPermissionMode(value, fieldName);
}
export function codexGoalPermissionModeError(value, fieldName = "permissionMode") {
    const supported = codexGoalPermissionModes.join(", ");
    const hint = value === "danger-full-access"
        ? " Use allow-edits to permit workspace changes. danger-full-access is a provider sandbox option, not a subscription-runtime edit policy."
        : "";
    return `codex_goal_permission_mode_invalid: ${fieldName} ${JSON.stringify(value)} is unsupported.${hint} Supported values: ${supported}.`;
}
//# sourceMappingURL=codex-goal-permission-mode.js.map