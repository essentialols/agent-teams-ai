import { describe, expect, it } from "vitest";

import { extractDesktopBearerToken } from "./desktop-auth.js";

describe("extractDesktopBearerToken", () => {
  it("accepts bearer tokens from the Authorization header", () => {
    expect(
      extractDesktopBearerToken({
        headers: { authorization: "Bearer agtcp_credential_secret" },
      }),
    ).toBe("agtcp_credential_secret");
  });

  it("rejects tokens in query params", () => {
    expect(() =>
      extractDesktopBearerToken({
        headers: { authorization: "Bearer agtcp_credential_secret" },
        query: { token: "agtcp_credential_secret" },
      }),
    ).toThrow("Desktop tokens must use the Authorization header.");
  });
});
