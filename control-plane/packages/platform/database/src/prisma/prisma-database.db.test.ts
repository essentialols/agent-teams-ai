import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.CONTROL_PLANE_TEST_DATABASE_URL;
const describeDb = databaseUrl === undefined ? describe.skip : describe;

describeDb("Phase 4 database schema", () => {
  let prisma: PrismaClient | undefined;

  beforeAll(async () => {
    if (databaseUrl === undefined) {
      throw new Error("CONTROL_PLANE_TEST_DATABASE_URL is required.");
    }
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
      errorFormat: "minimal",
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("has the Phase 4 outbox and content tables after migrations", async () => {
    if (prisma === undefined) {
      throw new Error("Prisma client was not initialized.");
    }
    const rows = await prisma.$queryRaw<readonly { table_name: string | null }[]>`
      SELECT to_regclass('public.outbox_events')::text AS table_name
      UNION ALL
      SELECT to_regclass('public.external_action_contents')::text AS table_name
      UNION ALL
      SELECT to_regclass('public.dead_letter_events')::text AS table_name
      UNION ALL
      SELECT to_regclass('public.distributed_locks')::text AS table_name
    `;

    expect(rows.map((row) => row.table_name).sort()).toEqual([
      "dead_letter_events",
      "distributed_locks",
      "external_action_contents",
      "outbox_events",
    ]);
  });
});
