import { describe, expect, it } from "vitest";

import {
  parseDesktopClientId,
  parseWorkspaceId,
  type TransactionContext,
} from "@agent-teams-control-plane/shared";

import type { WorkspaceIdentityRepository } from "../ports/workspace-identity.repository.js";
import { RotateDesktopClientTokenUseCase } from "./rotate-desktop-client-token.use-case.js";

describe("RotateDesktopClientTokenUseCase", () => {
  it("returns the stored token when rotation request id was already completed", async () => {
    const workspaceId = parseWorkspaceId("workspace-1");
    const desktopClientId = parseDesktopClientId("desktop-1");
    if (!workspaceId.ok) {
      throw workspaceId.error;
    }
    if (!desktopClientId.ok) {
      throw desktopClientId.error;
    }
    const calls: string[] = [];
    const repository = {
      completePairing: async () => ({ kind: "rejected" as const }),
      createBootstrapWorkspace: async () => undefined,
      createPairingSession: async () => undefined,
      findCredentialByLookupPrefix: async () => undefined,
      markCredentialUsed: async () => undefined,
      revokeDesktopClient: async () => undefined,
      rotateCredential: async () => ({
        desktopToken: storedToken("stored-token"),
        kind: "already-completed" as const,
      }),
    } satisfies WorkspaceIdentityRepository;
    const useCase = new RotateDesktopClientTokenUseCase(
      repository,
      transactionRunner(),
      {
        hash: async () => ({ value: "hashed-token" }),
        verify: async () => true,
      },
      {
        decryptToken: async () => "agtcp_existing_secret",
        encryptToken: async () => storedToken("new-token"),
      },
      {
        record: async () => {
          calls.push("audit");
        },
      },
      { uuid: () => "credential-id" },
      { pairingCode: () => "AGT-1111-2222-3333", secret: () => "secret" },
    );

    await expect(
      useCase.execute({
        actor: {
          credentialId: "credential-old",
          desktopClientId: desktopClientId.value,
          workspaceId: workspaceId.value,
        },
        desktopClientId: desktopClientId.value,
        rotationRequestId: "retry-request",
      }),
    ).resolves.toEqual({
      desktopClientId: desktopClientId.value,
      desktopToken: "agtcp_existing_secret",
    });
    expect(calls).toEqual([]);
  });
});

function transactionRunner() {
  return {
    runInTransaction: async <T>(work: (context: TransactionContext) => Promise<T>) =>
      work({ transactionId: "tx" } as TransactionContext),
  };
}

function storedToken(seed: string) {
  return {
    ciphertext: seed,
    ciphertextSha256: `${seed}-hash`,
    contentAuthTag: "YQ==",
    contentEncryptionAlgorithm: "AES-256-GCM" as const,
    contentNonce: "YQ==",
    dataKeyAlgorithm: "AES-256-GCM" as const,
    dataKeyAuthTag: "YQ==",
    dataKeyNonce: "YQ==",
    encryptedDataKey: "YQ==",
    keyRef: "test",
  };
}
