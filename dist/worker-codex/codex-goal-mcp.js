#!/usr/bin/env node
import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { McpServer, ResourceTemplate, } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listCodexGoalJobs, readCodexGoalJob, resolveCodexGoalJobRegistryRoot, summarizeCodexGoalJob, } from "./codex-goal-jobs.js";
import { registerCodexGoalPrompts } from "./codex-goal-mcp-prompts.js";
import { registerCodexGoalJobTools } from "./codex-goal-mcp-job-tools.js";
import { registerCodexGoalProjectControlTools } from "./codex-goal-mcp-project-control-tools.js";
import { registerCodexGoalRunEventTools } from "./codex-goal-mcp-run-event-tools.js";
import { registerCodexGoalWorkerControlTools, } from "./codex-goal-mcp-worker-control-tools.js";
import { registerCodexGoalInspectionTools, registerCodexGoalLaunchTools, } from "./codex-goal-mcp-operation-tools.js";
import { registerCodexGoalAccountTools } from "./codex-goal-mcp-account-tools.js";
export { buildCodexGoalBrief } from "./codex-goal-mcp-brief.js";
export { projectControllerPendingGuidancePromptContext, } from "./codex-goal-mcp-project-controller-provider.js";
export { availableCodexGoalAccountSlots, dedupeCodexGoalAccountSlots, visibleCodexGoalAccountPoolSlots, } from "./codex-goal-mcp-accounts.js";
const serverVersion = "0.1.0-main.2";
export function createCodexGoalMcpServer(options = {}) {
    const server = new McpServer({
        name: "subscription-runtime-codex-goal",
        version: serverVersion,
    });
    registerCodexGoalJobResource(server);
    registerCodexGoalPrompts(server);
    registerCodexGoalJobTools(server);
    registerCodexGoalRunEventTools(server);
    registerCodexGoalWorkerControlTools(server, options);
    registerCodexGoalAccountTools(server);
    registerCodexGoalLaunchTools(server);
    registerCodexGoalProjectControlTools(server);
    registerCodexGoalInspectionTools(server);
    return server;
}
function registerCodexGoalJobResource(server) {
    server.registerResource("codex-goal-job", new ResourceTemplate("codex-goal://jobs/{jobId}", {
        list: async () => {
            const registryRootDir = resolveCodexGoalJobRegistryRoot();
            const jobs = await listCodexGoalJobs({ registryRootDir });
            return {
                resources: jobs.map((job) => ({
                    uri: `codex-goal://jobs/${job.jobId}`,
                    name: job.jobId,
                    description: job.description ?? job.workspacePath,
                    mimeType: "application/json",
                })),
            };
        },
    }), {
        title: "Codex Goal Job",
        description: "A stored Codex goal job manifest.",
        mimeType: "application/json",
    }, async (uri, { jobId }) => {
        const registryRootDir = resolveCodexGoalJobRegistryRoot();
        const manifest = await readCodexGoalJob({
            registryRootDir,
            jobId: String(jobId),
        });
        return {
            contents: [{
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify({
                        manifest,
                        summary: summarizeCodexGoalJob(manifest, registryRootDir),
                    }, null, 2),
                }],
        };
    });
}
if (await isMainModule()) {
    try {
        const server = createCodexGoalMcpServer();
        await server.connect(new StdioServerTransport());
    }
    catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : "codex goal mcp failed"}\n`);
        process.exitCode = 1;
    }
}
async function isMainModule() {
    if (!process.argv[1])
        return false;
    try {
        return (await realpath(fileURLToPath(import.meta.url))) ===
            (await realpath(process.argv[1]));
    }
    catch {
        return fileURLToPath(import.meta.url) === process.argv[1];
    }
}
//# sourceMappingURL=codex-goal-mcp.js.map