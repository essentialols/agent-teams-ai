type JsonRecord = Record<string, unknown>;
export declare function listCodexGoalMcpTools(): Promise<unknown>;
export declare function callCodexGoalMcpTool(input: {
    readonly name: string;
    readonly args?: JsonRecord;
}): Promise<unknown>;
export declare function listCodexGoalMcpResources(): Promise<unknown>;
export declare function readCodexGoalMcpResource(input: {
    readonly uri: string;
}): Promise<unknown>;
export declare function listCodexGoalMcpPrompts(): Promise<unknown>;
export declare function getCodexGoalMcpPrompt(input: {
    readonly name: string;
    readonly args?: JsonRecord;
}): Promise<unknown>;
export {};
//# sourceMappingURL=codex-goal-mcp-client.d.ts.map