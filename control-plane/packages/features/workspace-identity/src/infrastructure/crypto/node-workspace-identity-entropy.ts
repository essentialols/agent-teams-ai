import { randomBytes, randomUUID } from "node:crypto";

import type {
  WorkspaceIdentityIdGenerator,
  WorkspaceIdentitySecretGenerator,
} from "../../application/ports/entropy.js";

export class NodeWorkspaceIdentityEntropy
  implements WorkspaceIdentityIdGenerator, WorkspaceIdentitySecretGenerator
{
  public uuid(): string {
    return randomUUID();
  }

  public secret(input: { bytes: number }): string {
    return randomBytes(input.bytes).toString("base64url");
  }

  public pairingCode(): string {
    const raw = randomBytes(9).toString("base64url").toUpperCase();
    return `AGT-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  }
}
