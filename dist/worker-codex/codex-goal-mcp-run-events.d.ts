/// <reference types="node" />
import { type AgentRunEventCompactionMcpArgs, type AgentRunEventsMcpArgs, type AgentRunProjectEventsMcpArgs, type AgentRunStateMcpArgs, type AgentRunWatchMcpArgs } from "./codex-goal-mcp-inputs.js";
type JsonObject = Readonly<Record<string, unknown>>;
export declare function watchAgentRuns(args: AgentRunWatchMcpArgs): Promise<JsonObject>;
export declare function readAgentRunEvents(args: AgentRunEventsMcpArgs): Promise<JsonObject>;
export declare function readAgentRunState(args: AgentRunStateMcpArgs): Promise<JsonObject>;
export declare function planAgentRunEventCompaction(args: AgentRunEventCompactionMcpArgs): Promise<JsonObject>;
export declare function compactAgentRunEvents(args: AgentRunEventCompactionMcpArgs): Promise<JsonObject>;
export declare function projectAgentRunEvents(args: AgentRunProjectEventsMcpArgs): Promise<JsonObject>;
export {};
//# sourceMappingURL=codex-goal-mcp-run-events.d.ts.map