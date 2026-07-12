export type SecretLikeContentKind =
  | "private_key"
  | "openai_token"
  | "github_token"
  | "aws_access_key"
  | "slack_token"
  | "quoted_secret_assignment"
  | "unquoted_secret_assignment"
  | "env_secret_assignment";

type SecretLikeContentPolicy = {
  readonly kind: SecretLikeContentKind;
  readonly pattern: RegExp;
};

const secretLikeContentPolicies: readonly SecretLikeContentPolicy[] = [
  {
    kind: "private_key",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    kind: "openai_token",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    kind: "github_token",
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  {
    kind: "slack_token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  },
  {
    kind: "aws_access_key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    kind: "quoted_secret_assignment",
    pattern: /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|client[_-]?secret|secret)\b\s*[:=]\s*["'][A-Za-z0-9_./+=-]{16,}["']/i,
  },
  {
    kind: "env_secret_assignment",
    pattern: /(?:^|\n)\s*[+-]?\s*[A-Z0-9_]*(?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|ID_TOKEN|CLIENT_SECRET|SECRET)\s*=\s*[A-Za-z0-9_./+=-]{16,}\s*(?:\r?$|\n)/,
  },
  {
    kind: "unquoted_secret_assignment",
    pattern: /(?:^|\n)\s*[+-]?\s*(?:api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|client[_-]?secret|secret)\s*[:=]\s*(?!process\.env\.)[A-Za-z0-9_./+=-]{16,}\s*(?:\r?$|\n)/i,
  },
];

export function detectSecretLikeContent(
  value: string | Buffer,
): SecretLikeContentKind | undefined {
  const text = typeof value === "string" ? value : value.toString("utf8");
  return secretLikeContentPolicies.find(({ pattern }) => pattern.test(text))?.kind;
}

export function matchesSecretLikeContentPatterns(
  value: string | Buffer,
  patterns: readonly RegExp[],
): boolean {
  const text = typeof value === "string" ? value : value.toString("utf8");
  return patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
