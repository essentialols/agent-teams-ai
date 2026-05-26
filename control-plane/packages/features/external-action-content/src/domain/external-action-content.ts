import {
  createSafeError,
  type ExternalActionContentId,
  type SafeError,
  type UnixMilliseconds,
} from "@agent-teams-control-plane/shared";

export type ExternalActionContentKind = string;

export type EncryptedExternalActionContent = Readonly<{
  id: ExternalActionContentId;
  kind: ExternalActionContentKind;
  ciphertext: Uint8Array | undefined;
  encryptedDataKey: Uint8Array | undefined;
  dataKeyAlgorithm: string;
  contentEncryptionAlgorithm: string;
  contentNonce: Uint8Array | undefined;
  contentAuthTag: Uint8Array | undefined;
  dataKeyNonce: Uint8Array | undefined;
  dataKeyAuthTag: Uint8Array | undefined;
  ciphertextSha256: string;
  keyRef: string;
  expiresAtMs: UnixMilliseconds;
  deletedAtMs?: UnixMilliseconds;
  shreddedAtMs?: UnixMilliseconds;
  createdAtMs: UnixMilliseconds;
}>;

export type ExternalActionContentRef = Readonly<{
  id: ExternalActionContentId;
  ciphertextSha256: string;
}>;

export function validateContentCanBeDispatched(
  content: EncryptedExternalActionContent,
  nowMs: UnixMilliseconds,
): SafeError | undefined {
  if (content.shreddedAtMs !== undefined) {
    return createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_EXTERNAL_CONTENT_SHREDDED",
      message: "External action content has been shredded.",
    });
  }
  if (content.deletedAtMs !== undefined) {
    return createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_EXTERNAL_CONTENT_DELETED",
      message: "External action content has been deleted.",
    });
  }
  if (content.expiresAtMs <= nowMs) {
    return createSafeError({
      category: "validation",
      code: "CONTROL_PLANE_EXTERNAL_CONTENT_EXPIRED",
      message: "External action content has expired.",
    });
  }
  if (
    content.ciphertext === undefined ||
    content.encryptedDataKey === undefined ||
    content.contentNonce === undefined ||
    content.contentAuthTag === undefined ||
    content.dataKeyNonce === undefined ||
    content.dataKeyAuthTag === undefined
  ) {
    return createSafeError({
      category: "internal",
      code: "CONTROL_PLANE_EXTERNAL_CONTENT_MISSING_ENCRYPTION_FIELDS",
      message: "External action content is missing encryption metadata.",
    });
  }
  return undefined;
}
