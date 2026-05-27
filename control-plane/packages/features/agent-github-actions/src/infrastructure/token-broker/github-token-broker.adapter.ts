import type { IssueGitHubInstallationTokenUseCase } from "@agent-teams-control-plane/features-github-token-broker";

import type { GitHubInstallationTokenBrokerPort } from "../../application/ports/github-installation-token-broker.port.js";

export class GitHubTokenBrokerAdapter implements GitHubInstallationTokenBrokerPort {
  public constructor(
    private readonly issueInstallationToken: IssueGitHubInstallationTokenUseCase,
  ) {}

  public async issue(
    input: Parameters<GitHubInstallationTokenBrokerPort["issue"]>[0],
  ): ReturnType<GitHubInstallationTokenBrokerPort["issue"]> {
    return this.issueInstallationToken.execute(input);
  }
}
