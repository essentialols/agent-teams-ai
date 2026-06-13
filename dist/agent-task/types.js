export const agentTaskProtocolVersion = 1;
export class AgentTaskProtocolError extends Error {
    code;
    constructor(code, safeMessage) {
        super(safeMessage);
        this.code = code;
        this.name = "AgentTaskProtocolError";
    }
}
export function makeAgentTaskFailure(code, safeMessage, input) {
    return {
        code,
        retryable: input?.retryable ?? false,
        reconnectRequired: input?.reconnectRequired ?? false,
        safeMessage,
        ...(input?.causeCategory ? { causeCategory: input.causeCategory } : {}),
    };
}
//# sourceMappingURL=types.js.map