import { type AgentTaskBridgeRunResult, type AgentTaskEvent, type AgentTaskHandler, type AgentTaskRunFunction } from "./types.js";
export type AgentTaskBridgeOptions = {
    readonly abortSignal?: AbortSignal;
    readonly now?: () => Date;
    onEvent?(event: AgentTaskEvent): void | Promise<void>;
};
export declare function runAgentTaskBridge(requestValue: unknown, handler: AgentTaskHandler | AgentTaskRunFunction, options?: AgentTaskBridgeOptions): Promise<AgentTaskBridgeRunResult>;
export declare function streamAgentTaskBridge(requestValue: unknown, handler: AgentTaskHandler | AgentTaskRunFunction, options?: Omit<AgentTaskBridgeOptions, "onEvent">): AsyncIterable<AgentTaskEvent>;
export declare function loadAgentTaskHandler(specifier: string, input?: {
    readonly cwd?: string;
}): Promise<AgentTaskHandler | AgentTaskRunFunction>;
//# sourceMappingURL=bridge.d.ts.map