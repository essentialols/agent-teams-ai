import { createPrivateKey, createSign } from "node:crypto";

import { createSafeError, toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type {
  GitHubAppJwt,
  GitHubAppJwtSigner,
  GitHubAppJwtSignerReadiness,
} from "../../application/ports/github-app-jwt-signer.port.js";
import type { GitHubTokenBrokerSettings } from "../../application/ports/policies.js";

export class NodeGitHubAppJwtSigner implements GitHubAppJwtSigner {
  public constructor(private readonly settings: GitHubTokenBrokerSettings) {}

  public async sign(input: { nowMs: number }): Promise<GitHubAppJwt> {
    const appJwtIssuer = this.settings.appJwtIssuer();
    const privateKey = this.settings.privateKey();
    if (appJwtIssuer === undefined || privateKey === undefined) {
      throw createSafeError({
        category: "validation",
        code: "CONTROL_PLANE_GITHUB_APP_CREDENTIALS_MISSING",
        message: "GitHub App credentials are incomplete.",
      });
    }

    const normalizedPrivateKey = normalizePrivateKey(privateKey);
    const keyObject = parsePrivateKeyOrThrow(normalizedPrivateKey);
    const issuedAtSeconds = Math.floor(input.nowMs / 1000) - 60;
    const expiresAtSeconds = Math.floor(input.nowMs / 1000) + 540;
    const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
    const payload = base64UrlJson({
      exp: expiresAtSeconds,
      iat: issuedAtSeconds,
      iss: appJwtIssuer,
    });
    const signingInput = `${header}.${payload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(keyObject).toString("base64url");

    return {
      expiresAtMs: toUnixMilliseconds(expiresAtSeconds * 1000),
      issuedAtMs: toUnixMilliseconds(issuedAtSeconds * 1000),
      value: `${signingInput}.${signature}`,
    };
  }

  public async checkReadiness(): Promise<GitHubAppJwtSignerReadiness> {
    const privateKey = this.settings.privateKey();
    if (privateKey === undefined) {
      return {
        privateKeyConfigured: false,
        privateKeyParseable: false,
        safeErrorCode: "CONTROL_PLANE_GITHUB_PRIVATE_KEY_MISSING",
      };
    }
    try {
      parsePrivateKeyOrThrow(normalizePrivateKey(privateKey));
      return {
        privateKeyConfigured: true,
        privateKeyParseable: true,
      };
    } catch {
      return {
        privateKeyConfigured: true,
        privateKeyParseable: false,
        safeErrorCode: "CONTROL_PLANE_GITHUB_PRIVATE_KEY_INVALID",
      };
    }
  }
}

export function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

function parsePrivateKeyOrThrow(value: string) {
  try {
    return createPrivateKey(value);
  } catch {
    throw createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_GITHUB_PRIVATE_KEY_INVALID",
      message: "GitHub App private key is invalid.",
    });
  }
}

function base64UrlJson(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}
