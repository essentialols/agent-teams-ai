export type CodexAppServerJsonRpcResponse = {
  readonly id?: number;
  readonly result?: Record<string, unknown>;
  readonly error?: { readonly message?: string };
};

export function parseJsonRpcLine(line: string): unknown | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export function encodeJsonRpcMessage(message: unknown): string {
  return `${JSON.stringify(message)}\n`;
}
