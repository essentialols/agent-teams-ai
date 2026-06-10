import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalFileWorkerAccountCapacityStore } from "../index";

describe("Local file worker account capacity store", () => {
  it("persists account cooldown across store instances", async () => {
    const rootDir = await tempRoot();
    const observedAt = new Date("2026-06-01T00:00:00.000Z");
    const resetAt = new Date("2026-06-01T01:00:00.000Z");

    try {
      new LocalFileWorkerAccountCapacityStore({ rootDir }).observe({
        accountId: " account-a ",
        observedAt,
        sourceWorkerId: "worker-a1",
        capacity: {
          availability: "cooldown",
          reason: "rate_limit_threshold",
          cooldownUntil: resetAt,
          details: { quotaGroup: "claude-oauth:account-a" },
        },
      });

      const restarted = new LocalFileWorkerAccountCapacityStore({ rootDir });

      expect(
        restarted.read({ accountId: "account-a", now: observedAt }),
      ).toMatchObject({
        availability: "cooldown",
        reason: "rate_limit_threshold",
        cooldownUntil: resetAt,
        lastLimitSignalAt: observedAt,
        details: {
          accountId: "account-a",
          quotaGroup: "claude-oauth:account-a",
          sourceWorkerId: "worker-a1",
        },
      });
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  it("expires cooldown records at reset time", async () => {
    const rootDir = await tempRoot();
    const observedAt = new Date("2026-06-01T00:00:00.000Z");
    const resetAt = new Date("2026-06-01T00:00:01.000Z");
    const store = new LocalFileWorkerAccountCapacityStore({ rootDir });

    try {
      store.observe({
        accountId: "account-a",
        observedAt,
        capacity: {
          availability: "cooldown",
          cooldownUntil: resetAt,
        },
      });

      expect(
        store.read({ accountId: "account-a", now: observedAt }),
      ).toMatchObject({
        availability: "cooldown",
      });
      expect(
        store.read({
          accountId: "account-a",
          now: new Date(resetAt.getTime() + 1),
        }),
      ).toBeNull();
      await expect(readCapacityFiles(rootDir)).resolves.toEqual([]);
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  it("keeps the more severe or longer account capacity signal", async () => {
    const rootDir = await tempRoot();
    const observedAt = new Date("2026-06-01T00:00:00.000Z");
    const shortResetAt = new Date("2026-06-01T00:30:00.000Z");
    const longResetAt = new Date("2026-06-01T01:00:00.000Z");
    const store = new LocalFileWorkerAccountCapacityStore({ rootDir });

    try {
      store.observe({
        accountId: "account-a",
        observedAt,
        capacity: {
          availability: "quota_exhausted",
          cooldownUntil: longResetAt,
        },
      });
      store.observe({
        accountId: "account-a",
        observedAt,
        capacity: {
          availability: "cooldown",
          reason: "rate_limit_threshold",
          cooldownUntil: shortResetAt,
        },
      });

      expect(
        store.read({ accountId: "account-a", now: observedAt }),
      ).toMatchObject({
        availability: "quota_exhausted",
        cooldownUntil: longResetAt,
      });
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  it("clears normalized account records", async () => {
    const rootDir = await tempRoot();
    const now = new Date("2026-06-01T00:00:00.000Z");
    const store = new LocalFileWorkerAccountCapacityStore({ rootDir });

    try {
      store.observe({
        accountId: " account-a ",
        observedAt: now,
        capacity: {
          availability: "cooldown",
          cooldownUntil: new Date("2026-06-01T01:00:00.000Z"),
        },
      });

      store.clear({ accountId: "account-a" });

      expect(store.read({ accountId: " account-a ", now })).toBeNull();
      await expect(readCapacityFiles(rootDir)).resolves.toEqual([]);
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });
});

async function tempRoot(): Promise<string> {
  return await mkdtemp(join(tmpdir(), "subscription-runtime-account-capacity-"));
}

async function readCapacityFiles(rootDir: string): Promise<readonly string[]> {
  try {
    return await readdir(join(rootDir, "account-capacity"));
  } catch {
    return [];
  }
}
