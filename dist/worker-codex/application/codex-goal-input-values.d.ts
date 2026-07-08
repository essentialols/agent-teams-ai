/// <reference types="node" />
import type { CodexGoalRunConfig } from "../codex-goal-runner.js";
export declare function tagValues(value: unknown): readonly string[];
export declare function putIfDefined(target: Record<string, unknown>, key: string, value: unknown): void;
export declare function accountNames(value: unknown): readonly string[];
export declare function stringsFromValue(value: unknown): readonly string[];
export declare function requiredString(value: unknown, name: string, cwd: string): string;
export declare function requiredRawString(value: unknown, name: string): string;
export declare function stringValue(value: unknown): string | undefined;
export declare function numberValue(value: unknown): number | undefined;
export declare function dateValue(value: unknown): Date | undefined;
export declare function positiveIntegerValue(value: unknown, name: string): number | undefined;
export declare function booleanValue(value: unknown): boolean | undefined;
export declare function workerReportModeValue(value: unknown): CodexGoalRunConfig["workerReportMode"] | undefined;
export declare function resolvePath(cwd: string, value: string): string;
//# sourceMappingURL=codex-goal-input-values.d.ts.map