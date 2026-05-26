import type {
  WorkspaceIdentityAbuseControlPolicy,
  WorkspaceIdentityAbuseAction,
} from "../../application/ports/policies.js";

export class NoopWorkspaceIdentityAbuseControlPolicy implements WorkspaceIdentityAbuseControlPolicy {
  public readonly calls: WorkspaceIdentityAbuseAction[] = [];

  public async assertAllowed(input: {
    action: WorkspaceIdentityAbuseAction;
  }): Promise<void> {
    this.calls.push(input.action);
  }
}
