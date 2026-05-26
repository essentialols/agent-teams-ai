import {
  parseDesktopClientId,
  parseWorkspaceId,
  toUnixMilliseconds,
  type DesktopClientId,
  type WorkspaceId,
} from "@agent-teams-control-plane/shared";

import type { DesktopClient, Workspace } from "../../domain/workspace-identity.js";
import type { CredentialHasher } from "../ports/credential-hasher.port.js";
import type {
  WorkspaceIdentityIdGenerator,
  WorkspaceIdentitySecretGenerator,
} from "../ports/entropy.js";
import type {
  WorkspaceIdentityAbuseControlPolicy,
  WorkspaceIdentityAuditLog,
  WorkspaceIdentityFeatureGatePolicy,
} from "../ports/policies.js";
import type { TransactionRunner } from "../ports/transaction-runner.js";
import type { WorkspaceIdentityRepository } from "../ports/workspace-identity.repository.js";
import { issueDesktopToken } from "./desktop-token.js";

export type BootstrapWorkspaceInput = Readonly<{
  desktopDisplayName?: string;
  workspaceDisplayName?: string;
}>;

export type BootstrapWorkspaceResult = Readonly<{
  workspaceId: WorkspaceId;
  desktopClientId: DesktopClientId;
  desktopToken: string;
}>;

export class BootstrapWorkspaceUseCase {
  public constructor(
    private readonly repository: WorkspaceIdentityRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly credentialHasher: CredentialHasher,
    private readonly featureGatePolicy: WorkspaceIdentityFeatureGatePolicy,
    private readonly abuseControlPolicy: WorkspaceIdentityAbuseControlPolicy,
    private readonly auditLog: WorkspaceIdentityAuditLog,
    private readonly idGenerator: WorkspaceIdentityIdGenerator,
    private readonly secretGenerator: WorkspaceIdentitySecretGenerator,
  ) {}

  public async execute(
    input: BootstrapWorkspaceInput,
  ): Promise<BootstrapWorkspaceResult> {
    await this.featureGatePolicy.assertEnabled("desktop-bootstrap");
    await this.abuseControlPolicy.assertAllowed({ action: "workspace-bootstrap" });

    const workspaceId = parseWorkspaceId(this.idGenerator.uuid());
    const desktopClientId = parseDesktopClientId(this.idGenerator.uuid());
    if (!workspaceId.ok) {
      throw workspaceId.error;
    }
    if (!desktopClientId.ok) {
      throw desktopClientId.error;
    }

    const now = new Date();
    const nowMs = toUnixMilliseconds(now.getTime());
    const credentialId = this.idGenerator.uuid();
    const issuedToken = issueDesktopToken({
      credentialId,
      secretGenerator: this.secretGenerator,
    });
    const tokenHash = await this.credentialHasher.hash({
      credential: issuedToken.rawToken,
      purpose: "desktop-token",
    });
    const workspace: Workspace = {
      createdAtMs: nowMs,
      displayName: normalizeDisplayName(input.workspaceDisplayName, "Local Workspace"),
      id: workspaceId.value,
      status: "active",
      updatedAtMs: nowMs,
    };
    const desktopClient: DesktopClient = {
      createdAtMs: nowMs,
      displayName: normalizeDisplayName(input.desktopDisplayName, "Desktop Client"),
      id: desktopClientId.value,
      status: "active",
      workspaceId: workspaceId.value,
    };

    await this.transactionRunner.runInTransaction(async (context) => {
      await this.repository.createBootstrapWorkspace(
        {
          credential: {
            createdAtMs: nowMs,
            desktopClientId: desktopClient.id,
            id: credentialId,
            lookupPrefix: issuedToken.lookupPrefix,
            status: "active",
            tokenHash: tokenHash.value,
            tokenVersion: 1,
          },
          desktopClient,
          workspace,
        },
        context,
      );
    });
    await this.auditLog.record({
      eventType: "workspace_bootstrapped",
      subjectId: workspace.id,
      subjectKind: "workspace",
      workspaceId: workspace.id,
    });

    return {
      desktopClientId: desktopClient.id,
      desktopToken: issuedToken.rawToken,
      workspaceId: workspace.id,
    };
  }
}

export function normalizeDisplayName(
  value: string | undefined,
  fallback: string,
): string {
  const normalized = value?.trim();
  if (normalized === undefined || normalized.length === 0) {
    return fallback;
  }
  return normalized.slice(0, 120);
}
