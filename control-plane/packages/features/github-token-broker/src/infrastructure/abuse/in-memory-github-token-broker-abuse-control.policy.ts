import { createSafeError } from "@agent-teams-control-plane/shared";

import type { GitHubTokenBrokerAbuseControlPolicy } from "../../application/ports/policies.js";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 120;

export class InMemoryGitHubTokenBrokerAbuseControlPolicy implements GitHubTokenBrokerAbuseControlPolicy {
  private readonly buckets = new Map<string, { count: number; resetAtMs: number }>();

  public async assertAllowed(
    input: Parameters<GitHubTokenBrokerAbuseControlPolicy["assertAllowed"]>[0],
  ): Promise<void> {
    const key = `${input.workspaceId}:${input.githubInstallationId}:${input.capability}`;
    const nowMs = Date.now();
    const current = this.buckets.get(key);
    if (current === undefined || current.resetAtMs <= nowMs) {
      this.buckets.set(key, { count: 1, resetAtMs: nowMs + WINDOW_MS });
      return;
    }
    if (current.count >= MAX_ATTEMPTS) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_GITHUB_TOKEN_BROKER_RATE_LIMITED",
        message: "GitHub token broker request limit exceeded.",
        retryable: true,
      });
    }
    current.count += 1;
  }
}
