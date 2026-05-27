import type { TrustedRequestSubjectKind } from "../../domain/index.js";

export type TargetPolicyEvaluationResult = Readonly<{
  allowed: boolean;
  reasonCode: string;
  policyVersion: number;
}>;

export interface TargetPolicyEvaluatorPort {
  evaluate(input: {
    workspaceId: string;
    targetId: string;
    capability: string;
    subjectKind: TrustedRequestSubjectKind;
    subjectId: string;
    desktopClientSubjectId?: string;
    teamSubjectId?: string;
    agentSubjectId?: string;
  }): Promise<TargetPolicyEvaluationResult>;
}
