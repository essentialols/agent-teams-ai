import type {
  ExternalActionContentId,
  SafeError,
  TransactionContext,
} from "@agent-teams-control-plane/shared";
import { createSafeError } from "@agent-teams-control-plane/shared";

export type StoredGitHubActionContentRef = Readonly<{
  id: ExternalActionContentId;
  ciphertextSha256: string;
}>;

export interface GitHubActionContentStore {
  store(input: {
    id: ExternalActionContentId;
    plaintext: Uint8Array;
    expiresAt: Date;
    context: TransactionContext;
  }): Promise<StoredGitHubActionContentRef>;

  load(input: { ref: StoredGitHubActionContentRef }): Promise<{ plaintext: Uint8Array }>;

  shred(input: {
    ref: StoredGitHubActionContentRef;
    context: TransactionContext;
  }): Promise<void>;
}

export function contentStoreFailureError(): SafeError {
  return createSafeError({
    category: "internal",
    code: "CONTROL_PLANE_GITHUB_ACTION_CONTENT_STORE_FAILED",
    message: "GitHub action content store failed.",
    retryable: false,
  });
}
