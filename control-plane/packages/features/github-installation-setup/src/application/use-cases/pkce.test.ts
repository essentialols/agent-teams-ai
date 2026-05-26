import { describe, expect, it } from "vitest";

import { createPkceChallenge } from "./pkce.js";

describe("createPkceChallenge", () => {
  it("creates the RFC7636 S256 challenge", () => {
    expect(createPkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});
