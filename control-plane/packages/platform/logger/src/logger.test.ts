import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsoleControlPlaneLogger } from "./logger.js";

describe("ConsoleControlPlaneLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts nested sensitive metadata before writing logs", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = new ConsoleControlPlaneLogger("test");

    logger.info("message", {
      config: {
        github: {
          appId: "123",
          privateKey: "private-key-value",
        },
        tokens: ["token-value"],
      },
      safe: "visible",
      webhookSecret: "secret-value",
    });

    const serialized = logSpy.mock.calls[0]?.[0];

    expect(serialized).toBeDefined();
    expect(serialized).not.toContain("private-key-value");
    expect(serialized).not.toContain("token-value");
    expect(serialized).not.toContain("secret-value");
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).toContain("visible");
  });
});
