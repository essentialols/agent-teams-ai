import { describe, expect, it } from "vitest";

import { InMemoryWorkspaceIdentityAbuseControlPolicy } from "./in-memory-workspace-identity-abuse-control.policy.js";

describe("InMemoryWorkspaceIdentityAbuseControlPolicy", () => {
  it("rejects repeated public pairing attempts with a safe error", async () => {
    const policy = new InMemoryWorkspaceIdentityAbuseControlPolicy();

    for (let index = 0; index < 30; index += 1) {
      await policy.assertAllowed({
        action: "pairing-complete",
        key: "public-pairing",
      });
    }

    await expect(
      policy.assertAllowed({
        action: "pairing-complete",
        key: "public-pairing",
      }),
    ).rejects.toMatchObject({
      category: "authorization",
      code: "CONTROL_PLANE_ABUSE_LIMIT_EXCEEDED",
      retryable: true,
    });
  });
});
