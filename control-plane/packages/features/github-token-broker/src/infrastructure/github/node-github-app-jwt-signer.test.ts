import { createVerify, generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import { toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { GitHubTokenBrokerSettings } from "../../application/ports/policies.js";
import {
  NodeGitHubAppJwtSigner,
  normalizePrivateKey,
} from "./node-github-app-jwt-signer.js";

describe("NodeGitHubAppJwtSigner", () => {
  it("signs RS256 GitHub App JWTs within GitHub time bounds", async () => {
    const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateKey = keyPair.privateKey.export({
      format: "pem",
      type: "pkcs8",
    }) as string;
    const signer = new NodeGitHubAppJwtSigner(
      settings(privateKey.replace(/\n/g, "\\n"), "app-client-id"),
    );

    const jwt = await signer.sign({
      nowMs: toUnixMilliseconds(1_700_000_000_000),
    });
    const [header, payload, signature] = jwt.value.split(".");

    expect(JSON.parse(Buffer.from(requiredPart(header), "base64url").toString())).toEqual(
      {
        alg: "RS256",
        typ: "JWT",
      },
    );
    expect(
      JSON.parse(Buffer.from(requiredPart(payload), "base64url").toString()),
    ).toEqual({
      exp: 1_700_000_540,
      iat: 1_699_999_940,
      iss: "app-client-id",
    });

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${requiredPart(header)}.${requiredPart(payload)}`);
    verifier.end();
    expect(
      verifier.verify(
        keyPair.publicKey,
        Buffer.from(requiredPart(signature), "base64url"),
      ),
    ).toBe(true);
  });

  it("normalizes escaped-newline private keys before parsing", async () => {
    const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateKey = keyPair.privateKey.export({
      format: "pem",
      type: "pkcs8",
    }) as string;

    expect(normalizePrivateKey(privateKey.replace(/\n/g, "\\n"))).toBe(privateKey.trim());
    await expect(
      new NodeGitHubAppJwtSigner(
        settings(privateKey.replace(/\n/g, "\\n"), "123"),
      ).checkReadiness(),
    ).resolves.toEqual({
      privateKeyConfigured: true,
      privateKeyParseable: true,
    });
  });

  it("reports missing and invalid private keys without exposing values", async () => {
    await expect(
      new NodeGitHubAppJwtSigner(settings(undefined, "123")).checkReadiness(),
    ).resolves.toEqual({
      privateKeyConfigured: false,
      privateKeyParseable: false,
      safeErrorCode: "CONTROL_PLANE_GITHUB_PRIVATE_KEY_MISSING",
    });
    await expect(
      new NodeGitHubAppJwtSigner(settings("not-a-key", "123")).checkReadiness(),
    ).resolves.toEqual({
      privateKeyConfigured: true,
      privateKeyParseable: false,
      safeErrorCode: "CONTROL_PLANE_GITHUB_PRIVATE_KEY_INVALID",
    });
  });
});

function settings(
  privateKey: string | undefined,
  appJwtIssuer: string | undefined,
): GitHubTokenBrokerSettings {
  return {
    appJwtIssuer: () => appJwtIssuer,
    privateKey: () => privateKey,
    readinessSnapshot: () => ({
      appClientIdConfigured: appJwtIssuer !== undefined,
      appIdConfigured: true,
      appSlugConfigured: true,
      mode: "hosted-official-app",
      privateKeyConfigured: privateKey !== undefined,
      publicBaseUrlConfigured: true,
      restApiVersionConfigured: true,
    }),
    restApiVersion: () => "2022-11-28",
  };
}

function requiredPart(value: string | undefined): string {
  if (value === undefined) {
    throw new Error("JWT part is missing.");
  }
  return value;
}
