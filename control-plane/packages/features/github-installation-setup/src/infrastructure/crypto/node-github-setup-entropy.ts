import { randomBytes, randomUUID } from "node:crypto";

import type {
  GitHubSetupIdGenerator,
  GitHubSetupSecretGenerator,
} from "../../application/ports/entropy.js";

export class NodeGitHubSetupEntropy
  implements GitHubSetupIdGenerator, GitHubSetupSecretGenerator
{
  public uuid(): string {
    return randomUUID();
  }

  public secret(input: { bytes: number }): string {
    return randomBytes(input.bytes).toString("base64url");
  }
}
