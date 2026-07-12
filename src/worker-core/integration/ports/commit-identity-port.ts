import {
  IntegrationError,
  IntegrationErrorReason,
} from "../domain/integration-errors";

export type CommitIdentity = {
  readonly name: string;
  readonly email: string;
};

export interface CommitIdentityPort {
  approvedIdentity(input: {
    readonly projectId: string;
    readonly workspacePath: string;
  }): Promise<CommitIdentity> | CommitIdentity;
}

export function assertCommitIdentity(
  value: CommitIdentity | undefined,
): CommitIdentity {
  if (!value) {
    throw new IntegrationError({
      reason: IntegrationErrorReason.CommitIdentityUnavailable,
      message: "project_integration_commit_identity_required",
    });
  }
  const name = value.name.trim();
  const email = value.email.trim();
  if (
    name.length === 0 ||
    name.length > 200 ||
    /[\r\n\0]/.test(name) ||
    email.length === 0 ||
    email.length > 320 ||
    /[\r\n\0<>\s]/.test(email) ||
    !email.includes("@")
  ) {
    throw new IntegrationError({
      reason: IntegrationErrorReason.CommitIdentityUnavailable,
      message: "project_integration_commit_identity_invalid",
    });
  }
  return { name, email };
}
