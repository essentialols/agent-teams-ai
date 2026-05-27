import { randomUUID } from "node:crypto";

import type { GitHubActionIdGenerator } from "../../application/ports/entropy.js";

export class NodeGitHubActionIdGenerator implements GitHubActionIdGenerator {
  public uuid(): string {
    return randomUUID();
  }
}
