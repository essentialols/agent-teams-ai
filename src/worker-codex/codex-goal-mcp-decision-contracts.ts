import { z } from "zod";

export const CODEX_GOAL_EXECUTION_ENGINE_SCHEMA = z.enum([
  "app-server",
  "app-server-goal",
  "packaged-exec",
  "plain-exec",
]);

export const CODEX_GOAL_CONTROL_SURFACE_SCHEMA = z.object({
  executionEngine: CODEX_GOAL_EXECUTION_ENGINE_SCHEMA,
  childWorkerSpawn: z.string(),
  hostAuthSurfaces: z.array(z.string()),
  guidance: z.string(),
  projectControlSurface: z.unknown().optional(),
});
