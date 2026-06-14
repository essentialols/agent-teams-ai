export const providerTaskSystemPromptMaxBytes = 256 * 1024;
export function providerTaskSystemPromptValidationError(value, path = "systemPrompt") {
    if (value === undefined)
        return null;
    if (value.trim().length === 0) {
        return `${path} must not be empty`;
    }
    if (Buffer.byteLength(value, "utf8") > providerTaskSystemPromptMaxBytes) {
        return `${path} exceeds ${providerTaskSystemPromptMaxBytes} bytes`;
    }
    return null;
}
export function assertProviderTaskSystemPrompt(value, path = "systemPrompt") {
    const error = providerTaskSystemPromptValidationError(value, path);
    if (error !== null)
        throw new Error(error);
}
//# sourceMappingURL=task-validation.js.map