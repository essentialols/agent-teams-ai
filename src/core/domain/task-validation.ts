export const providerTaskSystemPromptMaxBytes = 256 * 1024;

export function providerTaskSystemPromptValidationError(
  value: string | undefined,
  path = "systemPrompt",
): string | null {
  if (value === undefined) return null;
  if (value.trim().length === 0) {
    return `${path} must not be empty`;
  }
  if (Buffer.byteLength(value, "utf8") > providerTaskSystemPromptMaxBytes) {
    return `${path} exceeds ${providerTaskSystemPromptMaxBytes} bytes`;
  }
  return null;
}

export function assertProviderTaskSystemPrompt(
  value: string | undefined,
  path = "systemPrompt",
): void {
  const error = providerTaskSystemPromptValidationError(value, path);
  if (error !== null) throw new Error(error);
}
