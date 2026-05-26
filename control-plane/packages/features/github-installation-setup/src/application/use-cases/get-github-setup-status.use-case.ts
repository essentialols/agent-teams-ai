import type { DesktopClientActor } from "@agent-teams-control-plane/features-workspace-identity";

import type { GitHubSetupStatus } from "../../domain/github-installation-setup.js";
import type { GitHubSetupRepository } from "../ports/github-setup.repository.js";

export class GetGitHubSetupStatusUseCase {
  public constructor(private readonly repository: GitHubSetupRepository) {}

  public async execute(input: {
    actor: DesktopClientActor;
    setupSessionId: string;
  }): Promise<GitHubSetupStatus | undefined> {
    return this.repository.getSetupStatus(input);
  }
}
