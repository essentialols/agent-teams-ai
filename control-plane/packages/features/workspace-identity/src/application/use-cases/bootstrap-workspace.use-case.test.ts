import { describe, expect, it } from "vitest";

import type { TransactionContext } from "@agent-teams-control-plane/shared";

import type {
  BootstrapWorkspaceInput as RepositoryBootstrapWorkspaceInput,
  WorkspaceIdentityRepository,
} from "../ports/workspace-identity.repository.js";
import { BootstrapWorkspaceUseCase } from "./bootstrap-workspace.use-case.js";

describe("BootstrapWorkspaceUseCase", () => {
  it("checks feature gate and abuse policy before writes", async () => {
    const calls: string[] = [];
    const repository = fakeRepository(() => calls.push("write"));
    const useCase = new BootstrapWorkspaceUseCase(
      repository,
      transactionRunner(),
      fakeHasher(),
      {
        assertEnabled: async () => {
          calls.push("gate");
        },
      },
      {
        assertAllowed: async () => {
          calls.push("abuse");
        },
      },
      { record: async () => undefined },
      sequenceIds([
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
        "credential-id",
      ]),
      { pairingCode: () => "AGT-1111-2222-3333", secret: () => "secret" },
    );

    const result = await useCase.execute({
      desktopDisplayName: "Laptop",
      workspaceDisplayName: "Workspace",
    });

    expect(calls).toEqual(["gate", "abuse", "write"]);
    expect(result.desktopToken).toBe("agtcp_credential-id_secret");
    expect(repository.getCreated()?.workspace.displayName).toBe("Workspace");
    expect(repository.getCreated()?.desktopClient.displayName).toBe("Laptop");
    expect(repository.getCreated()?.credential.tokenHash).not.toBe(result.desktopToken);
  });

  it("does not write when feature gate rejects", async () => {
    const repository = fakeRepository(() => undefined);
    const useCase = new BootstrapWorkspaceUseCase(
      repository,
      transactionRunner(),
      fakeHasher(),
      {
        assertEnabled: async () => {
          throw new Error("disabled");
        },
      },
      { assertAllowed: async () => undefined },
      { record: async () => undefined },
      sequenceIds([]),
      { pairingCode: () => "AGT-1111-2222-3333", secret: () => "secret" },
    );

    await expect(useCase.execute({})).rejects.toThrow("disabled");
    expect(repository.getCreated()).toBeUndefined();
  });
});

function transactionRunner() {
  return {
    runInTransaction: async <T>(work: (context: TransactionContext) => Promise<T>) =>
      work({ transactionId: "tx" } as TransactionContext),
  };
}

function fakeHasher() {
  return {
    hash: async (input: { purpose: string; credential: string }) => ({
      value: `hashed:${input.purpose}:${input.credential}`,
    }),
    verify: async () => true,
  };
}

function fakeRepository(onWrite: () => void) {
  let created: RepositoryBootstrapWorkspaceInput | undefined;
  const repository = {
    createBootstrapWorkspace: async (input) => {
      onWrite();
      created = input;
    },
    getCreated: () => created,
    completePairing: async () => ({ kind: "rejected" as const }),
    createPairingSession: async () => undefined,
    findCredentialByLookupPrefix: async () => undefined,
    markCredentialUsed: async () => undefined,
    revokeDesktopClient: async () => undefined,
    rotateCredential: async () => ({ kind: "created" as const }),
  } satisfies WorkspaceIdentityRepository & {
    getCreated(): RepositoryBootstrapWorkspaceInput | undefined;
  };
  return repository;
}

function sequenceIds(values: string[]) {
  let index = 0;
  return {
    uuid: () => values[index++] ?? "00000000-0000-0000-0000-000000000099",
  };
}
