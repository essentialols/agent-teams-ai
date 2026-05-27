import { createSafeError, type SafeError } from "@agent-teams-control-plane/shared";

import {
  assertGitHubActionType,
  decodeGitHubActionPayload,
  validateGitHubActionPayload,
  type GitHubActionPayload,
  type GitHubActionType,
} from "../../domain/index.js";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type StoredGitHubActionPayloadEnvelope = Readonly<{
  actionType: GitHubActionType;
  payload: GitHubActionPayload;
}>;

export function encodeGitHubActionPayloadEnvelope(
  envelope: StoredGitHubActionPayloadEnvelope,
): Uint8Array {
  return textEncoder.encode(JSON.stringify(envelope));
}

export function decodeGitHubActionPayloadEnvelope(
  plaintext: Uint8Array,
): StoredGitHubActionPayloadEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(textDecoder.decode(plaintext));
  } catch {
    throw invalidStoredPayloadError();
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("actionType" in parsed) ||
    !("payload" in parsed)
  ) {
    throw invalidStoredPayloadError();
  }
  const actionType = assertGitHubActionType(parsed.actionType);
  const payload = decodeGitHubActionPayload({
    actionType,
    payload: parsed.payload,
  });
  const invalid = validateGitHubActionPayload({ actionType, payload });
  if (invalid !== undefined) {
    throw invalid;
  }
  return { actionType, payload };
}

function invalidStoredPayloadError(): SafeError {
  return createSafeError({
    category: "validation",
    code: "CONTROL_PLANE_GITHUB_ACTION_STORED_PAYLOAD_INVALID",
    message: "Stored GitHub action payload is invalid.",
  });
}
