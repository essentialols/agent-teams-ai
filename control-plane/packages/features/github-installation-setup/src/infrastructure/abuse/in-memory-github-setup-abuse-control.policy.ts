import { createSafeError } from "@agent-teams-control-plane/shared";

import type {
  GitHubSetupAbuseAction,
  GitHubSetupAbuseControlPolicy,
} from "../../application/ports/policies.js";

type LimitRule = Readonly<{
  maxAttempts: number;
  windowMs: number;
}>;

const rules = {
  "github-claim-start": { maxAttempts: 30, windowMs: 5 * 60 * 1000 },
  "github-oauth-callback": { maxAttempts: 120, windowMs: 60 * 1000 },
  "github-setup-callback": { maxAttempts: 120, windowMs: 60 * 1000 },
  "github-setup-start": { maxAttempts: 120, windowMs: 60 * 1000 },
} satisfies Record<GitHubSetupAbuseAction, LimitRule>;

export class InMemoryGitHubSetupAbuseControlPolicy implements GitHubSetupAbuseControlPolicy {
  private readonly buckets = new Map<string, { count: number; resetAtMs: number }>();

  public async assertAllowed(
    input: Parameters<GitHubSetupAbuseControlPolicy["assertAllowed"]>[0],
  ): Promise<void> {
    const action = input.action;
    const rule = rules[action];
    const key = `${action}:${input.actor?.workspaceId ?? "public"}:${input.actor?.desktopClientId ?? input.key ?? "anonymous"}`;
    const nowMs = Date.now();
    const current = this.buckets.get(key);
    if (current === undefined || current.resetAtMs <= nowMs) {
      this.buckets.set(key, { count: 1, resetAtMs: nowMs + rule.windowMs });
      return;
    }
    if (current.count >= rule.maxAttempts) {
      throw createSafeError({
        category: "authorization",
        code: "CONTROL_PLANE_ABUSE_LIMIT_EXCEEDED",
        message: "Control-plane request limit exceeded.",
        retryable: true,
        safeDetails: { action },
      });
    }
    current.count += 1;
  }
}
