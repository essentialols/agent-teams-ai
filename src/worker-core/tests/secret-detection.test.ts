import { describe, expect, it } from "vitest";

import { detectSecretLikeContent } from "../secret-detection";

describe("detectSecretLikeContent", () => {
  it.each([
    ["OPENAI_API_KEY=abcdefghijklmnopqrstuvwxyz", "env_secret_assignment"],
    ["-OPENAI_API_KEY=abcdefghijklmnopqrstuvwxyz", "env_secret_assignment"],
    ["api_key: 'abcdefghijklmnopqrstuvwxyz'", "quoted_secret_assignment"],
    ["api_key: abcdefghijklmnopqrstuvwxyz", "unquoted_secret_assignment"],
    ["+api_key: abcdefghijklmnopqrstuvwxyz", "unquoted_secret_assignment"],
    [`SLACK_TOKEN=xoxb-${"a".repeat(24)}`, "slack_token"],
  ] as const)("detects canonical secret content", (content, kind) => {
    expect(detectSecretLikeContent(content)).toBe(kind);
  });

  it.each([
    "const apiKey = process.env.OPENAI_API_KEY;",
    "const secret = await getSecret();",
    "API_KEY=<your-api-key>",
    "The API_KEY setting must contain at least 16 characters.",
  ])("does not classify safe source or placeholders", (content) => {
    expect(detectSecretLikeContent(content)).toBeUndefined();
  });
});
