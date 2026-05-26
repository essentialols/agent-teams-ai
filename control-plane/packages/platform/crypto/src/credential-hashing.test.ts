import { describe, expect, it } from "vitest";

import { NodeCryptoCredentialHasher } from "./credential-hashing.js";

describe("NodeCryptoCredentialHasher", () => {
  it("uses purpose-separated keyed hashes", async () => {
    const hasher = new NodeCryptoCredentialHasher(Buffer.alloc(32, 3).toString("base64"));

    const desktopHash = await hasher.hash({
      credential: "same-secret",
      purpose: "desktop-token",
    });
    const pairingHash = await hasher.hash({
      credential: "same-secret",
      purpose: "pairing-code",
    });

    expect(desktopHash.value).toMatch(/^v1:hmac-sha256:desktop-token:[0-9a-f]{64}$/);
    expect(pairingHash.value).toMatch(/^v1:hmac-sha256:pairing-code:[0-9a-f]{64}$/);
    expect(pairingHash.value).not.toBe(desktopHash.value);
  });

  it("verifies expected hashes and rejects wrong values", async () => {
    const hasher = new NodeCryptoCredentialHasher(Buffer.alloc(32, 7).toString("base64"));
    const hash = await hasher.hash({
      credential: "raw-token",
      purpose: "desktop-token",
    });

    await expect(
      hasher.verify({
        credential: "raw-token",
        expectedHash: hash.value,
        purpose: "desktop-token",
      }),
    ).resolves.toBe(true);
    await expect(
      hasher.verify({
        credential: "other-token",
        expectedHash: hash.value,
        purpose: "desktop-token",
      }),
    ).resolves.toBe(false);
    await expect(
      hasher.verify({
        credential: "raw-token",
        expectedHash: hash.value,
        purpose: "github-setup-state",
      }),
    ).resolves.toBe(false);
  });
});
