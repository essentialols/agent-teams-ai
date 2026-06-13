import type { AgentTaskRoundMemberIdentity } from "./types.js";
export type AgentTaskRoundIndependenceFailure = "same-provider-model" | "same-independence-group";
export type AgentTaskRoundIndependenceResult = {
    readonly ok: true;
} | {
    readonly ok: false;
    readonly failure: AgentTaskRoundIndependenceFailure;
    readonly safeMessage: string;
};
export declare function compareAgentTaskRoundMembers(member: AgentTaskRoundMemberIdentity, other: AgentTaskRoundMemberIdentity): AgentTaskRoundIndependenceResult;
export declare function assertAgentTaskRoundMembersIndependent(member: AgentTaskRoundMemberIdentity, other: AgentTaskRoundMemberIdentity): void;
export declare function agentTaskRoundMemberFingerprint(member: AgentTaskRoundMemberIdentity): string;
//# sourceMappingURL=rounds.d.ts.map