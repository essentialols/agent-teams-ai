import { describe, expect, it } from "vitest";

import { NodeCryptoEnvelopeEncryption } from "./envelope-encryption.js";

describe("NodeCryptoEnvelopeEncryption", () => {
  it("roundtrips plaintext with separate content and data-key auth metadata", async () => {
    const crypto = new NodeCryptoEnvelopeEncryption(
      Buffer.alloc(32, 7).toString("base64"),
    );
    const plaintext = Buffer.from("sensitive comment body");

    const encrypted = await crypto.encrypt(plaintext);
    const decrypted = await crypto.decrypt(encrypted);

    expect(Buffer.from(decrypted.plaintext).toString("utf8")).toBe(
      "sensitive comment body",
    );
    expect(encrypted.contentNonce).not.toEqual(encrypted.dataKeyNonce);
    expect(encrypted.contentAuthTag).not.toEqual(encrypted.dataKeyAuthTag);
    expect(encrypted.ciphertextSha256).not.toBe(
      "d95dc1813da7aee01bdc9d85c66309b390c16043b2a2f19744cbdab01c6ed1ca",
    );
  });

  it("fails closed when auth metadata is wrong", async () => {
    const crypto = new NodeCryptoEnvelopeEncryption(
      Buffer.alloc(32, 7).toString("base64"),
    );
    const encrypted = await crypto.encrypt(Buffer.from("body"));

    await expect(
      crypto.decrypt({
        ...encrypted,
        contentAuthTag: Buffer.alloc(encrypted.contentAuthTag.byteLength, 1),
      }),
    ).rejects.toMatchObject({
      code: "CONTROL_PLANE_DECRYPTION_FAILED",
    });
  });
});
