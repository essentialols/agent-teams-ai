import type {
  GitHubSetupAbuseAction,
  GitHubSetupAbuseControlPolicy,
} from "../../application/ports/policies.js";

export class NoopGitHubSetupAbuseControlPolicy implements GitHubSetupAbuseControlPolicy {
  public readonly calls: GitHubSetupAbuseAction[] = [];

  public async assertAllowed(input: { action: GitHubSetupAbuseAction }): Promise<void> {
    this.calls.push(input.action);
  }
}
