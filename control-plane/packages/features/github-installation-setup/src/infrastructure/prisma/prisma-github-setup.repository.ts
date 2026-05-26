import { randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";

import {
  getPrismaTransactionClient,
  PRISMA_DATABASE_CLIENT,
  type PrismaDatabaseClient,
} from "@agent-teams-control-plane/platform-database";
import {
  createSafeError,
  parseDesktopClientId,
  parseIntegrationConnectionId,
  parseWorkspaceId,
  toUnixMilliseconds,
  type SafeError,
} from "@agent-teams-control-plane/shared";

import type {
  GitHubInstallationClaim,
  GitHubOAuthClaimSession,
  GitHubSetupStatus,
} from "../../domain/github-installation-setup.js";
import type {
  GitHubSetupRepository,
  OAuthSessionWithClaim,
  SetupCallbackResult,
} from "../../application/ports/github-setup.repository.js";
import type { StoredPkceVerifier } from "../../application/ports/pkce-secret-store.js";
import type { TransactionContext } from "../../application/ports/transaction-runner.js";

@Injectable()
export class PrismaGitHubSetupRepository implements GitHubSetupRepository {
  public constructor(
    @Inject(PRISMA_DATABASE_CLIENT)
    private readonly databaseClient: PrismaDatabaseClient,
  ) {}

  public async createSetupSession(
    input: Parameters<GitHubSetupRepository["createSetupSession"]>[0],
    context: TransactionContext,
  ): Promise<void> {
    const client = getPrismaTransactionClient(context);
    await client.gitHubSetupSession.create({
      data: {
        createdAt: new Date(input.nowMs),
        desktopClientId: input.actor.desktopClientId,
        expiresAt: new Date(input.expiresAtMs),
        id: input.id,
        setupStateHash: input.setupStateHash,
        status: "install_url_created",
        updatedAt: new Date(input.nowMs),
        workspaceId: input.actor.workspaceId,
      },
    });
  }

  public async handleSetupCallback(
    input: Parameters<GitHubSetupRepository["handleSetupCallback"]>[0],
    context: TransactionContext,
  ): Promise<SetupCallbackResult> {
    if (
      input.setupStateHash === undefined ||
      input.githubInstallationId === undefined ||
      input.githubInstallationId.trim().length === 0
    ) {
      return { kind: "untrusted-callback" };
    }

    const client = getPrismaTransactionClient(context);
    const setup = await client.gitHubSetupSession.findFirst({
      include: { claims: true },
      where: { setupStateHash: input.setupStateHash },
    });
    if (
      setup === null ||
      setup.expiresAt.getTime() <= input.nowMs ||
      setup.status === "connected" ||
      setup.status === "failed" ||
      setup.status === "expired" ||
      setup.status === "cancelled"
    ) {
      return { kind: "untrusted-callback" };
    }
    if (
      setup.githubInstallationId !== null &&
      setup.githubInstallationId !== input.githubInstallationId
    ) {
      return { kind: "untrusted-callback" };
    }

    const existingClaim = setup.claims.find(
      (claim) => claim.githubInstallationId === input.githubInstallationId,
    );
    if (existingClaim !== undefined) {
      if (existingClaim.claimContinuationConsumedAt === null) {
        await client.gitHubInstallationClaim.update({
          data: {
            claimContinuationTokenHash: input.claimContinuationTokenHash,
          },
          where: { id: existingClaim.id },
        });
      }
      return {
        claimContinuationToken: input.claimContinuationToken,
        claimId: existingClaim.id,
        kind: "pending-claim",
        setupSessionId: setup.id,
      };
    }

    await client.gitHubSetupSession.update({
      data: {
        consumedAt: setup.consumedAt ?? new Date(input.nowMs),
        githubInstallationId: input.githubInstallationId,
        status: "pending_claim",
        updatedAt: new Date(input.nowMs),
      },
      where: { id: setup.id },
    });
    await client.gitHubInstallationClaim.create({
      data: {
        claimAuthorityKind: "github_user_oauth",
        claimContinuationTokenHash: input.claimContinuationTokenHash,
        createdAt: new Date(input.nowMs),
        githubInstallationId: input.githubInstallationId,
        id: input.claimId,
        setupSessionId: setup.id,
        status: "pending",
        workspaceId: setup.workspaceId,
      },
    });

    return {
      claimContinuationToken: input.claimContinuationToken,
      claimId: input.claimId,
      kind: "pending-claim",
      setupSessionId: setup.id,
    };
  }

  public async recordUnclaimedCallback(input: {
    githubInstallationId?: string;
    setupStatePresent: boolean;
    nowMs: number;
  }): Promise<void> {
    if (!this.databaseClient.isEnabled()) {
      return;
    }
    await this.databaseClient.getClient().gitHubUnclaimedInstallationCallback.create({
      data: {
        expiresAt: new Date(input.nowMs + 24 * 60 * 60 * 1000),
        firstSeenAt: new Date(input.nowMs),
        id: randomUUID(),
        lastSeenAt: new Date(input.nowMs),
        safeMetadataJson: {
          setupStatePresent: input.setupStatePresent,
        },
        setupStatePresent: input.setupStatePresent,
        status: "recorded",
        ...(input.githubInstallationId === undefined
          ? {}
          : { githubInstallationId: input.githubInstallationId }),
      },
    });
  }

  public async createOAuthSession(
    input: Parameters<GitHubSetupRepository["createOAuthSession"]>[0],
    context: TransactionContext,
  ): Promise<GitHubOAuthClaimSession> {
    const client = getPrismaTransactionClient(context);
    const claim = await client.gitHubInstallationClaim.findFirst({
      include: { setupSession: true },
      where: {
        claimContinuationTokenHash: input.claimContinuationTokenHash,
        id: input.claimId,
        status: "pending",
      },
    });
    if (
      claim === null ||
      claim.claimContinuationConsumedAt !== null ||
      claim.setupSession.expiresAt.getTime() <= input.nowMs ||
      claim.setupSession.status !== "pending_claim" ||
      claim.setupSession.githubInstallationId !== claim.githubInstallationId
    ) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_CLAIM_CONTINUATION_INVALID",
        message: "Claim continuation token is invalid or expired.",
      });
    }

    const row = await client.gitHubOAuthClaimSession.create({
      data: {
        codeChallengeMethod: "S256",
        createdAt: new Date(input.nowMs),
        desktopClientId: claim.setupSession.desktopClientId,
        expiresAt: new Date(input.expiresAtMs),
        githubInstallationClaimId: claim.id,
        id: input.id,
        oauthStateHash: input.oauthStateHash,
        pkceVerifierCiphertext: input.pkceVerifier,
        redirectUriSnapshot: input.redirectUri,
        status: "redirected",
        workspaceId: claim.workspaceId,
      },
    });
    return mapOAuthSession(row);
  }

  public async consumeOAuthState(
    input: Parameters<GitHubSetupRepository["consumeOAuthState"]>[0],
    context: TransactionContext,
  ): Promise<OAuthSessionWithClaim | undefined> {
    const client = getPrismaTransactionClient(context);
    const row = await client.gitHubOAuthClaimSession.findFirst({
      include: { claim: { include: { setupSession: true } } },
      where: {
        consumedAt: null,
        oauthStateHash: input.oauthStateHash,
        status: { in: ["created", "redirected"] },
      },
    });
    if (
      row === null ||
      row.expiresAt.getTime() <= input.nowMs ||
      row.claim.status !== "pending" ||
      row.claim.claimContinuationConsumedAt !== null ||
      row.claim.setupSession.expiresAt.getTime() <= input.nowMs ||
      row.claim.setupSession.status !== "pending_claim" ||
      row.claim.setupSession.githubInstallationId !== row.claim.githubInstallationId ||
      row.claim.workspaceId !== row.workspaceId ||
      row.claim.setupSession.workspaceId !== row.workspaceId ||
      row.claim.setupSession.desktopClientId !== row.desktopClientId
    ) {
      return undefined;
    }
    const consumed = await client.gitHubOAuthClaimSession.updateMany({
      data: {
        consumedAt: new Date(input.nowMs),
        status: "verifying",
      },
      where: {
        consumedAt: null,
        id: row.id,
        status: { in: ["created", "redirected"] },
      },
    });
    if (consumed.count !== 1) {
      return undefined;
    }

    return {
      claim: mapClaim(row.claim),
      oauthSession: mapOAuthSession({
        ...row,
        consumedAt: new Date(input.nowMs),
        status: "verifying",
      }),
      pkceVerifier: parseStoredPkceVerifier(row.pkceVerifierCiphertext),
    };
  }

  public async markOAuthFailed(input: {
    oauthSessionId?: string;
    providerErrorCode?: string;
    safeError: SafeError;
  }): Promise<void> {
    if (input.oauthSessionId === undefined || !this.databaseClient.isEnabled()) {
      return;
    }
    await this.databaseClient.getClient().gitHubOAuthClaimSession.updateMany({
      data: {
        failureSafeErrorJson: safeErrorJson(input.safeError),
        status: "failed",
        ...(input.providerErrorCode === undefined
          ? {}
          : { providerErrorCode: input.providerErrorCode }),
      },
      where: { id: input.oauthSessionId },
    });
  }

  public async markClaimFailed(input: {
    claimId: string;
    safeError: SafeError;
  }): Promise<void> {
    await this.databaseClient.getClient().gitHubInstallationClaim.updateMany({
      data: {
        failureSafeErrorJson: safeErrorJson(input.safeError),
        status: "failed",
      },
      where: { id: input.claimId },
    });
  }

  public async markClaimBound(
    input: Parameters<GitHubSetupRepository["markClaimBound"]>[0],
    context: TransactionContext,
  ): Promise<void> {
    const client = getPrismaTransactionClient(context);
    await client.$queryRaw<readonly { id: string }[]>`
      SELECT id
      FROM github_installation_claims
      WHERE id = ${input.claimId}
      FOR UPDATE
    `;
    const claim = await client.gitHubInstallationClaim.findFirst({
      include: { setupSession: true },
      where: { id: input.claimId },
    });
    if (
      claim !== null &&
      claim.status === "bound" &&
      claim.setupSessionId === input.setupSessionId &&
      claim.setupSession.status === "connected" &&
      claim.setupSession.githubInstallationId === claim.githubInstallationId
    ) {
      await client.gitHubOAuthClaimSession.updateMany({
        data: { status: "verified" },
        where: {
          githubInstallationClaimId: input.claimId,
          status: "verifying",
        },
      });
      return;
    }
    if (
      claim === null ||
      (claim.status !== "pending" && claim.status !== "verified") ||
      claim.claimContinuationConsumedAt !== null ||
      claim.setupSessionId !== input.setupSessionId ||
      claim.setupSession.expiresAt.getTime() <= input.nowMs ||
      claim.setupSession.status !== "pending_claim" ||
      claim.setupSession.githubInstallationId !== claim.githubInstallationId
    ) {
      throw createSafeError({
        category: "conflict",
        code: "CONTROL_PLANE_GITHUB_CLAIM_NOT_BINDABLE",
        message: "GitHub installation claim can no longer be bound.",
      });
    }
    await client.gitHubInstallationClaim.update({
      data: {
        claimContinuationConsumedAt: new Date(input.nowMs),
        status: "bound",
        verifiedAt: new Date(input.nowMs),
        verifiedGithubLoginSnapshot: input.verifiedGithubLogin,
        verifiedGithubUserId: input.verifiedGithubUserId,
      },
      where: { id: input.claimId },
    });
    await client.gitHubSetupSession.update({
      data: {
        status: "connected",
        updatedAt: new Date(input.nowMs),
      },
      where: { id: input.setupSessionId },
    });
    await client.gitHubOAuthClaimSession.updateMany({
      data: { status: "verified" },
      where: {
        githubInstallationClaimId: input.claimId,
        status: "verifying",
      },
    });
  }

  public async getSetupStatus(input: {
    actor: Parameters<GitHubSetupRepository["getSetupStatus"]>[0]["actor"];
    setupSessionId: string;
  }): Promise<GitHubSetupStatus | undefined> {
    const row = await this.databaseClient.getClient().gitHubSetupSession.findFirst({
      include: { claims: true },
      where: {
        desktopClientId: input.actor.desktopClientId,
        id: input.setupSessionId,
        workspaceId: input.actor.workspaceId,
      },
    });
    if (row === null) {
      return undefined;
    }
    const boundConnection =
      row.githubInstallationId === null
        ? null
        : await this.databaseClient.getClient().integrationConnection.findFirst({
            where: {
              provider: "github",
              providerInstallationId: row.githubInstallationId,
              status: { not: "deleted" },
              workspaceId: input.actor.workspaceId,
            },
          });
    const claim = row.claims[0];
    const connectionId =
      boundConnection === null
        ? undefined
        : parseIntegrationConnectionId(boundConnection.id);
    if (connectionId !== undefined && !connectionId.ok) {
      throw connectionId.error;
    }
    const safeFailureCode =
      row.failureSafeErrorJson === null
        ? undefined
        : safeErrorCodeFromJson(row.failureSafeErrorJson);

    return {
      expiresAt: row.expiresAt.toISOString(),
      setupSessionId: row.id,
      status: assertSetupStatus(row.status),
      ...(row.githubInstallationId === null
        ? {}
        : { githubInstallationId: row.githubInstallationId }),
      ...(claim === undefined ? {} : { claimId: claim.id }),
      ...(connectionId === undefined ? {} : { connectionId: connectionId.value }),
      ...(safeFailureCode === undefined ? {} : { safeFailureCode }),
    };
  }
}

function mapOAuthSession(row: {
  id: string;
  workspaceId: string;
  desktopClientId: string;
  githubInstallationClaimId: string;
  redirectUriSnapshot: string;
  status: string;
  expiresAt: Date;
  consumedAt: Date | null;
}): GitHubOAuthClaimSession {
  const workspaceId = parseWorkspaceId(row.workspaceId);
  const desktopClientId = parseDesktopClientId(row.desktopClientId);
  if (!workspaceId.ok) {
    throw workspaceId.error;
  }
  if (!desktopClientId.ok) {
    throw desktopClientId.error;
  }
  return {
    desktopClientId: desktopClientId.value,
    expiresAtMs: toUnixMilliseconds(row.expiresAt.getTime()),
    githubInstallationClaimId: row.githubInstallationClaimId,
    id: row.id,
    redirectUriSnapshot: row.redirectUriSnapshot,
    status: assertOAuthStatus(row.status),
    workspaceId: workspaceId.value,
    ...(row.consumedAt === null
      ? {}
      : { consumedAtMs: toUnixMilliseconds(row.consumedAt.getTime()) }),
  };
}

function mapClaim(row: {
  id: string;
  workspaceId: string;
  setupSessionId: string;
  githubInstallationId: string;
  status: string;
  claimAuthorityKind: string;
  verifiedGithubUserId: string | null;
  verifiedGithubLoginSnapshot: string | null;
  verifiedAt: Date | null;
}): GitHubInstallationClaim {
  const workspaceId = parseWorkspaceId(row.workspaceId);
  if (!workspaceId.ok) {
    throw workspaceId.error;
  }
  return {
    claimAuthorityKind: "github_user_oauth",
    githubInstallationId: row.githubInstallationId,
    id: row.id,
    setupSessionId: row.setupSessionId,
    status: assertClaimStatus(row.status),
    workspaceId: workspaceId.value,
    ...(row.verifiedAt === null
      ? {}
      : { verifiedAtMs: toUnixMilliseconds(row.verifiedAt.getTime()) }),
    ...(row.verifiedGithubLoginSnapshot === null
      ? {}
      : { verifiedGithubLoginSnapshot: row.verifiedGithubLoginSnapshot }),
    ...(row.verifiedGithubUserId === null
      ? {}
      : { verifiedGithubUserId: row.verifiedGithubUserId }),
  };
}

function parseStoredPkceVerifier(value: unknown): StoredPkceVerifier {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createSafeError({
      category: "internal",
      code: "CONTROL_PLANE_PKCE_VERIFIER_CORRUPT",
      message: "PKCE verifier storage is invalid.",
    });
  }
  return value as StoredPkceVerifier;
}

function safeErrorJson(safeError: SafeError) {
  return {
    category: safeError.category,
    code: safeError.code,
    message: safeError.message,
    retryable: safeError.retryable,
    ...(safeError.safeDetails === undefined
      ? {}
      : { safeDetails: safeError.safeDetails }),
  };
}

function safeErrorCodeFromJson(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("code" in value)) {
    return undefined;
  }
  return typeof value.code === "string" ? value.code : undefined;
}

function assertSetupStatus(value: string): GitHubSetupStatus["status"] {
  if (
    value === "install_url_created" ||
    value === "installation_callback_received" ||
    value === "pending_claim" ||
    value === "connected" ||
    value === "failed" ||
    value === "expired" ||
    value === "cancelled"
  ) {
    return value;
  }
  throw new Error(`Unknown GitHub setup status ${value}`);
}

function assertClaimStatus(value: string): GitHubInstallationClaim["status"] {
  if (
    value === "pending" ||
    value === "verified" ||
    value === "bound" ||
    value === "failed" ||
    value === "expired"
  ) {
    return value;
  }
  throw new Error(`Unknown GitHub claim status ${value}`);
}

function assertOAuthStatus(value: string): GitHubOAuthClaimSession["status"] {
  if (
    value === "created" ||
    value === "redirected" ||
    value === "callback_received" ||
    value === "verifying" ||
    value === "verified" ||
    value === "failed" ||
    value === "expired" ||
    value === "cancelled"
  ) {
    return value;
  }
  throw new Error(`Unknown GitHub OAuth status ${value}`);
}
