import { describe, expect, it } from "vitest";
import {
  projectControlRefillAccountNames,
  rotateProjectControlAccountNames,
} from "../codex-goal-mcp-project-accounts";

describe("project-control refill account rotation", () => {
  it("distributes sequential jobs across distinct starting accounts", () => {
    const accounts = ["account-a", "account-b", "account-c"];

    const rotations = ["job-0", "job-1", "job-2"].map((jobId) =>
      rotateProjectControlAccountNames(accounts, jobId)
    );

    expect(rotations.map(([first]) => first)).toEqual([
      "account-b",
      "account-c",
      "account-a",
    ]);
    for (const rotation of rotations) {
      expect(new Set(rotation)).toEqual(new Set(accounts));
    }
  });

  it("keeps caller order when no rotation key is available", () => {
    const accounts = ["account-a", "account-b"];

    expect(rotateProjectControlAccountNames(accounts)).toEqual(accounts);
    expect(rotateProjectControlAccountNames(accounts, "  ")).toEqual(accounts);
  });

  it("rotates only accounts allowed by the project scope", async () => {
    await expect(
      projectControlRefillAccountNames({
        requestedAccounts: ["account-a", "account-b", "account-c"],
        allowedAccountIds: ["account-a", "account-c"],
        rotationKey: "job-0",
      })
    ).resolves.toEqual(["account-c", "account-a"]);
  });

  it("returns every fallback account exactly once", () => {
    const accounts = ["account-a", "account-b", "account-c", "account-d"];
    const rotated = rotateProjectControlAccountNames(accounts, "worker-42");

    expect(rotated).toHaveLength(accounts.length);
    expect(new Set(rotated)).toEqual(new Set(accounts));
  });
});
