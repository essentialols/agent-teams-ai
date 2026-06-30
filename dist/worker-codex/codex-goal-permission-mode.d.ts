import type { ProviderTaskControls } from "@vioxen/subscription-runtime/core";
export type CodexGoalPermissionMode = NonNullable<ProviderTaskControls["permissionMode"]>;
export declare const codexGoalPermissionModes: readonly ["read-only", "preapproved", "allow-edits", "bypass", "none"];
export declare function parseCodexGoalPermissionMode(value: string, fieldName?: string): CodexGoalPermissionMode;
export declare function optionalCodexGoalPermissionMode(value: string | undefined, fieldName?: string): CodexGoalPermissionMode | undefined;
export declare function codexGoalPermissionModeError(value: string, fieldName?: string): string;
//# sourceMappingURL=codex-goal-permission-mode.d.ts.map