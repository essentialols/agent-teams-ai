import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
export function tagValues(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [];
}
export function putIfDefined(target, key, value) {
    if (value !== undefined)
        target[key] = value;
}
export function accountNames(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [];
}
export function stringsFromValue(value) {
    return accountNames(value);
}
export function requiredString(value, name, cwd) {
    return resolvePath(cwd, requiredRawString(value, name));
}
export function requiredRawString(value, name) {
    const text = stringValue(value);
    if (!text)
        throw new Error(`${name} is required`);
    return text;
}
export function stringValue(value) {
    return typeof value === "string" && value.trim() ? value : undefined;
}
export function numberValue(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
export function dateValue(value) {
    if (typeof value !== "string")
        return undefined;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
}
export function positiveIntegerValue(value, name) {
    if (value === undefined)
        return undefined;
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }
    return value;
}
export function booleanValue(value) {
    return typeof value === "boolean" ? value : undefined;
}
export function workerReportModeValue(value) {
    if (value === undefined)
        return undefined;
    if (value === "runtime-only" || value === "structured-output")
        return value;
    throw new Error("workerReportMode must be runtime-only or structured-output");
}
export function resolvePath(cwd, value) {
    const expanded = value.startsWith("~/")
        ? join(homedir(), value.slice(2))
        : value;
    return isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
}
//# sourceMappingURL=codex-goal-input-values.js.map