import { createSafeError, type SafeError } from "@agent-teams-control-plane/shared";

import type { WorkspaceIdentitySecretGenerator } from "../ports/entropy.js";

const tokenPrefix = "agtcp";
const tokenSecretBytes = 32;

export type IssuedDesktopToken = Readonly<{
  credentialId: string;
  lookupPrefix: string;
  rawToken: string;
}>;

export function issueDesktopToken(input: {
  credentialId: string;
  secretGenerator: WorkspaceIdentitySecretGenerator;
}): IssuedDesktopToken {
  const lookupPrefix = `${tokenPrefix}_${input.credentialId}`;
  return {
    credentialId: input.credentialId,
    lookupPrefix,
    rawToken: `${lookupPrefix}_${input.secretGenerator.secret({ bytes: tokenSecretBytes })}`,
  };
}

export function extractDesktopTokenLookupPrefix(rawToken: string): string | undefined {
  const parts = rawToken.split("_");
  if (parts.length !== 3 || parts[0] !== tokenPrefix || parts[1]?.length === 0) {
    return undefined;
  }
  return `${parts[0]}_${parts[1]}`;
}

export function invalidDesktopTokenError(): SafeError {
  return createSafeError({
    category: "authorization",
    code: "CONTROL_PLANE_DESKTOP_AUTH_INVALID",
    message: "Desktop client authentication failed.",
  });
}
