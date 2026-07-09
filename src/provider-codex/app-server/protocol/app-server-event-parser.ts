export function isCodexAppServerReconnectProgressMessage(
  message: string,
): boolean {
  return /\breconnecting(?:\.{3}|…)?\s*\d+\s*\/\s*\d+\b/i.test(message);
}
