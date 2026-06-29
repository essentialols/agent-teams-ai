import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createCodexGoalMcpServer } from "./codex-goal-mcp.js";
export async function listCodexGoalMcpTools() {
    return withCodexGoalMcpClient((client) => client.listTools());
}
export async function callCodexGoalMcpTool(input) {
    return withCodexGoalMcpClient(async (client) => parseMcpJsonResult(await client.callTool({
        name: input.name,
        arguments: input.args ?? {},
    })));
}
export async function listCodexGoalMcpResources() {
    return withCodexGoalMcpClient((client) => client.listResources());
}
export async function readCodexGoalMcpResource(input) {
    return withCodexGoalMcpClient((client) => client.readResource({ uri: input.uri }));
}
export async function listCodexGoalMcpPrompts() {
    return withCodexGoalMcpClient((client) => client.listPrompts());
}
export async function getCodexGoalMcpPrompt(input) {
    return withCodexGoalMcpClient((client) => client.getPrompt({
        name: input.name,
        arguments: Object.fromEntries(Object.entries(input.args ?? {}).map(([key, value]) => [key, String(value)])),
    }));
}
async function withCodexGoalMcpClient(action) {
    const server = createCodexGoalMcpServer();
    const client = new Client({
        name: "subscription-runtime-codex-goal-cli",
        version: "0.0.0",
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
    ]);
    try {
        return await action(client);
    }
    finally {
        await client.close();
        await server.close();
    }
}
function parseMcpJsonResult(result) {
    if (isRecord(result) && "structuredContent" in result) {
        return result.structuredContent;
    }
    const content = isRecord(result) && Array.isArray(result.content)
        ? result.content
        : undefined;
    const first = content?.[0];
    if (isRecord(first) && first.type === "text" && typeof first.text === "string") {
        try {
            return JSON.parse(first.text);
        }
        catch {
            return { text: first.text };
        }
    }
    return result;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=codex-goal-mcp-client.js.map