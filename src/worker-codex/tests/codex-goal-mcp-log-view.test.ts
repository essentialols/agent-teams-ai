import { describe, expect, it } from "vitest";
import {
  extractRecentCommands,
  redactLogTail,
} from "../codex-goal-mcp-log-view";

describe("codex goal MCP log view", () => {
  it("extracts recent command lines and redacts command secrets", () => {
    const commands = extractRecentCommands([
      "ordinary output",
      "$ npm test",
      "$ npm test",
      "> python scripts/check.py token=raw-secret",
      "+ git status --short",
    ].join("\n"));

    expect(commands).toEqual([
      "npm test",
      "python scripts/check.py token=[redacted:token-field]",
      "git status --short",
    ]);
    expect(commands.join("\n")).not.toContain("raw-secret");
  });

  it("redacts non-command log tail lines before returning them", () => {
    const tail = redactLogTail([
      "Authorization: Bearer rawBearerSecret",
      "raw log line",
      "$ npm run check token=raw-secret",
    ].join("\n"));

    expect(tail).not.toContain("rawBearerSecret");
    expect(tail).not.toContain("raw-secret");
    expect(tail).toContain("Bearer [redacted]");
    expect(tail).toContain("token=[redacted:token-field]");
  });
});
