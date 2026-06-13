import type { AgentTaskRoundMemberIdentity } from "./types.js";
export type AgentTaskCertificationCheck = {
    readonly name: string;
    readonly status: "passed" | "failed";
    readonly safeMessage: string;
};
export type AgentTaskCertificationReport = {
    readonly status: "passed" | "failed";
    readonly checks: readonly AgentTaskCertificationCheck[];
};
export type AgentTaskCertificationInput = {
    readonly request: unknown;
    readonly result: unknown;
    readonly events?: readonly unknown[];
    readonly forbiddenSecrets?: readonly string[];
    readonly requireRoundMemberIdentity?: boolean;
    readonly requireRoundMemberIndependence?: boolean;
    readonly requireTerminalEvent?: boolean;
    readonly distinctFromRoundMember?: AgentTaskRoundMemberIdentity;
};
export declare function certifyAgentTaskExchange(input: AgentTaskCertificationInput): AgentTaskCertificationReport;
export declare function assertAgentTaskCertification(input: AgentTaskCertificationInput): void;
//# sourceMappingURL=certification.d.ts.map