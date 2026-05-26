import { describe, expect, it } from "vitest";

import {
  createSafeError,
  parseDesktopClientId,
  parseWorkspaceId,
  type TransactionContext,
} from "@agent-teams-control-plane/shared";

import { CompleteGitHubClaimOAuthUseCase } from "./complete-github-claim-oauth.use-case.js";

describe("CompleteGitHubClaimOAuthUseCase", () => {
  it("does not exchange a code when provider returned OAuth error", async () => {
    const calls: string[] = [];
    const workspace = parseWorkspaceId("workspace-1");
    const desktopClient = parseDesktopClientId("desktop-1");
    if (!workspace.ok) {
      throw workspace.error;
    }
    if (!desktopClient.ok) {
      throw desktopClient.error;
    }
    const workspaceId = workspace.value;
    const desktopClientId = desktopClient.value;
    const repository = {
      consumeOAuthState: async () => ({
        claim: {
          claimAuthorityKind: "github_user_oauth" as const,
          githubInstallationId: "123",
          id: "claim-1",
          setupSessionId: "setup-1",
          status: "pending" as const,
          workspaceId,
        },
        oauthSession: {
          desktopClientId,
          expiresAtMs: 1 as never,
          githubInstallationClaimId: "claim-1",
          id: "oauth-1",
          redirectUriSnapshot: "https://control.example/api/public/github/oauth/callback",
          status: "verifying" as const,
          workspaceId,
        },
        pkceVerifier: encryptedVerifier(),
      }),
      getSetupStatus: async () => undefined,
      createOAuthSession: async () => {
        throw new Error("not used");
      },
      createSetupSession: async () => undefined,
      handleSetupCallback: async () => ({ kind: "untrusted-callback" as const }),
      markClaimBound: async () => undefined,
      markClaimFailed: async () => undefined,
      markOAuthFailed: async () => {
        calls.push("oauth-failed");
      },
      recordUnclaimedCallback: async () => undefined,
    };
    const useCase = new CompleteGitHubClaimOAuthUseCase(
      repository,
      {
        bindVerifiedInstallation: async () => {
          throw new Error("not used");
        },
        listForWorkspace: async () => [],
      },
      transactionRunner(),
      {
        hash: async () => ({ value: "hashed-state" }),
        verify: async () => true,
      },
      {
        decryptVerifier: async () => "verifier",
        encryptVerifier: async () => encryptedVerifier(),
      },
      {
        exchangeCode: async () => {
          calls.push("exchange");
          throw new Error("not expected");
        },
      },
      {
        verifyInstallationClaim: async () => {
          calls.push("verify");
          throw new Error("not expected");
        },
      },
      { assertAllowed: async () => undefined },
      { record: async () => undefined },
      { uuid: () => "connection-1" },
    );

    await expect(
      useCase.execute({
        providerErrorCode: "access_denied",
        state: "oauth-state",
      }),
    ).resolves.toEqual({
      safeErrorCode: "access_denied",
      status: "failed",
    });
    expect(calls).toEqual(["oauth-failed"]);
  });

  it("keeps the claim restartable when provider verification rejects", async () => {
    const calls: string[] = [];
    const workspace = parseWorkspaceId("workspace-1");
    const desktopClient = parseDesktopClientId("desktop-1");
    if (!workspace.ok) {
      throw workspace.error;
    }
    if (!desktopClient.ok) {
      throw desktopClient.error;
    }
    const repository = {
      consumeOAuthState: async () => ({
        claim: {
          claimAuthorityKind: "github_user_oauth" as const,
          githubInstallationId: "123",
          id: "claim-1",
          setupSessionId: "setup-1",
          status: "pending" as const,
          workspaceId: workspace.value,
        },
        oauthSession: {
          desktopClientId: desktopClient.value,
          expiresAtMs: 1 as never,
          githubInstallationClaimId: "claim-1",
          id: "oauth-1",
          redirectUriSnapshot: "https://control.example/api/public/github/oauth/callback",
          status: "verifying" as const,
          workspaceId: workspace.value,
        },
        pkceVerifier: encryptedVerifier(),
      }),
      getSetupStatus: async () => undefined,
      createOAuthSession: async () => {
        throw new Error("not used");
      },
      createSetupSession: async () => undefined,
      handleSetupCallback: async () => ({ kind: "untrusted-callback" as const }),
      markClaimBound: async () => undefined,
      markClaimFailed: async () => {
        calls.push("claim-failed");
      },
      markOAuthFailed: async () => {
        calls.push("oauth-failed");
      },
      recordUnclaimedCallback: async () => undefined,
    };
    const useCase = new CompleteGitHubClaimOAuthUseCase(
      repository,
      {
        bindVerifiedInstallation: async () => {
          throw new Error("not used");
        },
        listForWorkspace: async () => [],
      },
      transactionRunner(),
      {
        hash: async () => ({ value: "hashed-state" }),
        verify: async () => true,
      },
      {
        decryptVerifier: async () => "verifier",
        encryptVerifier: async () => encryptedVerifier(),
      },
      {
        exchangeCode: async () => ({
          accessToken: "user-token",
          refreshTokenReceived: false,
          tokenType: "bearer",
        }),
      },
      {
        verifyInstallationClaim: async () => ({
          kind: "rejected" as const,
          safeError: createSafeError({
            category: "authorization",
            code: "CONTROL_PLANE_GITHUB_INSTALLATION_NOT_ACCESSIBLE",
            message: "GitHub installation is not accessible to this user.",
          }),
        }),
      },
      { assertAllowed: async () => undefined },
      { record: async () => undefined },
      { uuid: () => "connection-1" },
    );

    await expect(
      useCase.execute({
        code: "oauth-code",
        state: "oauth-state",
      }),
    ).resolves.toEqual({
      safeErrorCode: "CONTROL_PLANE_GITHUB_INSTALLATION_NOT_ACCESSIBLE",
      status: "failed",
    });
    expect(calls).toEqual(["oauth-failed"]);
  });
});

function transactionRunner() {
  return {
    runInTransaction: async <T>(work: (context: TransactionContext) => Promise<T>) =>
      work({ transactionId: "tx" } as TransactionContext),
  };
}

function encryptedVerifier() {
  return {
    ciphertext: "YQ==",
    ciphertextSha256: "hash",
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
