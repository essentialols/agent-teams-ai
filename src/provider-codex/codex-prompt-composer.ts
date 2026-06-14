export function composeCodexPrompt(input: {
  readonly prompt: string;
  readonly systemPrompt?: string | undefined;
}): string {
  const systemPrompt = input.systemPrompt?.trim();
  if (!systemPrompt) return input.prompt;
  return [
    "System instructions:",
    systemPrompt,
    "",
    "User task:",
    input.prompt,
  ].join("\n");
}
