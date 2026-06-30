import type { ProviderTaskControls } from "@vioxen/subscription-runtime/core";

export type CodexGoalPermissionMode = NonNullable<
  ProviderTaskControls["permissionMode"]
>;

export const codexGoalPermissionModes = [
  "read-only",
  "preapproved",
  "allow-edits",
  "bypass",
  "none",
] as const satisfies readonly CodexGoalPermissionMode[];

const codexGoalPermissionModeSet = new Set<string>(codexGoalPermissionModes);

export function parseCodexGoalPermissionMode(
  value: string,
  fieldName = "permissionMode",
): CodexGoalPermissionMode {
  if (codexGoalPermissionModeSet.has(value)) {
    return value as CodexGoalPermissionMode;
  }
  throw new Error(codexGoalPermissionModeError(value, fieldName));
}

export function optionalCodexGoalPermissionMode(
  value: string | undefined,
  fieldName = "permissionMode",
): CodexGoalPermissionMode | undefined {
  return value === undefined
    ? undefined
    : parseCodexGoalPermissionMode(value, fieldName);
}

export function codexGoalPermissionModeError(
  value: string,
  fieldName = "permissionMode",
): string {
  const supported = codexGoalPermissionModes.join(", ");
  const hint = value === "danger-full-access"
    ? " Use allow-edits to permit workspace changes. danger-full-access is a provider sandbox option, not a subscription-runtime edit policy."
    : "";
  return `codex_goal_permission_mode_invalid: ${fieldName} ${JSON.stringify(value)} is unsupported.${hint} Supported values: ${supported}.`;
}
