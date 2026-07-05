import { describe, expect, it } from "vitest";

import { readTargetRevision, type RevisionReaderPort } from "../index";

describe("readTargetRevision", () => {
  it("returns the target commit from a revision reader port", async () => {
    const reader: RevisionReaderPort = {
      async readHeadCommit() {
        return { commit: "abc123" };
      },
    };

    await expect(readTargetRevision(reader, {
      workspacePath: "/work/project",
    })).resolves.toEqual({ commit: "abc123" });
  });

  it("does not invent a target commit when the adapter cannot read one", async () => {
    const reader: RevisionReaderPort = {
      async readHeadCommit() {
        return { reason: "not_git_workspace" };
      },
    };

    await expect(readTargetRevision(reader, {
      workspacePath: "/work/project",
    })).resolves.toEqual({});
  });
});
