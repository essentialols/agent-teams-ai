import { describe, expect, it } from "vitest";
import { assertProjectRefillInputPatchSource } from "../application/project-control/codex-goal-project-input-patch-policy";

describe("project refill input patch policy", () => {
  it("requires immutable producer evidence for a non-null input patch", () => {
    expect(() => assertProjectRefillInputPatchSource({
      contract: { inputPatchHash: "a".repeat(64) },
      producerJobId: undefined,
      workerRole: "producer",
    })).toThrow("project_control_refill_input_patch_source_required");
  });

  it("allows only producer refill to consume immutable input patch evidence", () => {
    expect(() => assertProjectRefillInputPatchSource({
      contract: { inputPatchHash: "a".repeat(64) },
      producerJobId: "project-rejected-producer",
      workerRole: "producer",
    })).not.toThrow();
    expect(() => assertProjectRefillInputPatchSource({
      contract: { inputPatchHash: "a".repeat(64) },
      producerJobId: "project-rejected-producer",
      workerRole: "reviewer",
    })).toThrow("project_control_refill_input_patch_producer_role_required");
  });

  it("rejects an input patch source when the contract declares clean input", () => {
    expect(() => assertProjectRefillInputPatchSource({
      contract: { inputPatchHash: null },
      producerJobId: "project-rejected-producer",
      workerRole: "producer",
    })).toThrow("project_control_refill_input_patch_hash_required");
  });
});
