import { describe, expect, it } from "vitest";

import { controlledAgentControllerSystemPrompt } from "../index";

describe("controlledAgentControllerSystemPrompt", () => {
  it("documents broker-only runtime safety without owning orchestration policy", () => {
    const prompt = controlledAgentControllerSystemPrompt();

    expect(prompt).toContain("Use only the broker/status tools");
    expect(prompt).toContain("Do not ask for raw shell");
    expect(prompt).toContain("host objective or delivered guidance");
    expect(prompt).toContain("Do not invent project strategy");
    expect(prompt).not.toContain("Create child workers");
    expect(prompt).toContain("Never read or print secrets");
  });
});
