/// <reference types="node" />
import { z } from "zod";
export declare const CODEX_GOAL_EXECUTION_ENGINE_SCHEMA: z.ZodEnum<{
    "app-server-goal": "app-server-goal";
    "app-server": "app-server";
    "packaged-exec": "packaged-exec";
    "plain-exec": "plain-exec";
}>;
export declare const CODEX_GOAL_CONTROL_SURFACE_SCHEMA: z.ZodObject<{
    executionEngine: z.ZodEnum<{
        "app-server-goal": "app-server-goal";
        "app-server": "app-server";
        "packaged-exec": "packaged-exec";
        "plain-exec": "plain-exec";
    }>;
    childWorkerSpawn: z.ZodString;
    hostAuthSurfaces: z.ZodArray<z.ZodString>;
    guidance: z.ZodString;
    projectControlSurface: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strip>;
//# sourceMappingURL=codex-goal-mcp-decision-contracts.d.ts.map