import { toUnixMilliseconds } from "@agent-teams-control-plane/shared";

import type { DesktopClientActor } from "../../domain/workspace-identity.js";
import type { CredentialHasher } from "../ports/credential-hasher.port.js";
import type { WorkspaceIdentityRepository } from "../ports/workspace-identity.repository.js";
import {
  extractDesktopTokenLookupPrefix,
  invalidDesktopTokenError,
} from "./desktop-token.js";

export type DesktopClientAuthResult =
  | Readonly<{
      kind: "authenticated";
      actor: DesktopClientActor;
    }>
  | Readonly<{
      kind: "rejected";
    }>;

export class AuthenticateDesktopClientUseCase {
  public constructor(
    private readonly repository: WorkspaceIdentityRepository,
    private readonly credentialHasher: CredentialHasher,
  ) {}

  public async execute(rawToken: string | undefined): Promise<DesktopClientAuthResult> {
    if (rawToken === undefined) {
      return { kind: "rejected" };
    }

    const lookupPrefix = extractDesktopTokenLookupPrefix(rawToken.trim());
    if (lookupPrefix === undefined) {
      return { kind: "rejected" };
    }

    const lookup = await this.repository.findCredentialByLookupPrefix(lookupPrefix);
    if (lookup === undefined) {
      return { kind: "rejected" };
    }

    const nowMs = toUnixMilliseconds(Date.now());
    if (
      lookup.workspace.status !== "active" ||
      lookup.client.status !== "active" ||
      lookup.credential.status !== "active" ||
      (lookup.credential.expiresAtMs !== undefined &&
        lookup.credential.expiresAtMs <= nowMs)
    ) {
      return { kind: "rejected" };
    }

    const valid = await this.credentialHasher.verify({
      credential: rawToken,
      expectedHash: lookup.credential.tokenHash,
      purpose: "desktop-token",
    });
    if (!valid) {
      return { kind: "rejected" };
    }

    await this.repository.markCredentialUsed({
      credentialId: lookup.credential.id,
      desktopClientId: lookup.client.id,
      nowMs,
    });

    return {
      actor: {
        credentialId: lookup.credential.id,
        desktopClientId: lookup.client.id,
        workspaceId: lookup.workspace.id,
      },
      kind: "authenticated",
    };
  }

  public async require(rawToken: string | undefined): Promise<DesktopClientActor> {
    const result = await this.execute(rawToken);
    if (result.kind === "rejected") {
      throw invalidDesktopTokenError();
    }
    return result.actor;
  }
}
