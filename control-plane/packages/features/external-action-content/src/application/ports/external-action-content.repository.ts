import type {
  EncryptedExternalActionContent,
  ExternalActionContentRef,
} from "../../domain/external-action-content.js";
import type { TransactionContext } from "./transaction-context.js";

export type StoreEncryptedExternalActionContentInput = Omit<
  EncryptedExternalActionContent,
  | "ciphertext"
  | "contentAuthTag"
  | "contentNonce"
  | "createdAtMs"
  | "dataKeyAuthTag"
  | "dataKeyNonce"
  | "deletedAtMs"
  | "encryptedDataKey"
  | "shreddedAtMs"
> &
  Readonly<{
    ciphertext: Uint8Array;
    encryptedDataKey: Uint8Array;
    contentNonce: Uint8Array;
    contentAuthTag: Uint8Array;
    dataKeyNonce: Uint8Array;
    dataKeyAuthTag: Uint8Array;
  }>;

export interface ExternalActionContentRepository {
  storeEncrypted(
    input: StoreEncryptedExternalActionContentInput,
    context: TransactionContext,
  ): Promise<ExternalActionContentRef>;
  findById(
    id: ExternalActionContentRef["id"],
  ): Promise<EncryptedExternalActionContent | undefined>;
  shred(ref: ExternalActionContentRef, context: TransactionContext): Promise<void>;
}
