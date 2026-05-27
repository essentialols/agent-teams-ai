import type { EvaluateTargetPolicyUseCase } from "@agent-teams-control-plane/features-integration-targets";

import type { TargetPolicyEvaluatorPort } from "../../application/ports/target-policy-evaluator.port.js";

export class IntegrationTargetPolicyEvaluatorAdapter implements TargetPolicyEvaluatorPort {
  public constructor(private readonly evaluatePolicy: EvaluateTargetPolicyUseCase) {}

  public evaluate(
    input: Parameters<TargetPolicyEvaluatorPort["evaluate"]>[0],
  ): ReturnType<TargetPolicyEvaluatorPort["evaluate"]> {
    return this.evaluatePolicy.execute(input);
  }
}
