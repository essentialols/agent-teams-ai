import type {
  HandoffContractInput,
  HandoffManifest,
} from "../domain/handoff-contract";
import { ValidateHandoffContractUseCase } from "./validate-handoff-contract";

export class BuildHandoffManifestUseCase {
  constructor(
    private readonly validator: ValidateHandoffContractUseCase =
      new ValidateHandoffContractUseCase(),
  ) {}

  build(input: HandoffContractInput): HandoffManifest {
    return this.validator.validate(input);
  }
}

export function buildHandoffManifest(
  input: HandoffContractInput,
): HandoffManifest {
  return new BuildHandoffManifestUseCase().build(input);
}
