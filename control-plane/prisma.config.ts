import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.CONTROL_PLANE_DATABASE_URL ??
  process.env.DATABASE_URL ??
  (process.env.PRISMA_GENERATE_ALLOW_NO_DATABASE_URL === "1"
    ? "postgresql://control_plane:control_plane@127.0.0.1:5432/agent_teams_control_plane"
    : undefined);

if (databaseUrl === undefined) {
  throw new Error(
    "CONTROL_PLANE_DATABASE_URL is required for Prisma commands. Use db:generate for local type generation without a live database.",
  );
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
});
