export function compareAgentTaskRoundMembers(member, other) {
    if (providerModelKey(member) === providerModelKey(other)) {
        return {
            ok: false,
            failure: "same-provider-model",
            safeMessage: "Round members must use distinct provider/model identities.",
        };
    }
    if (normalized(member.independenceGroup) === normalized(other.independenceGroup)) {
        return {
            ok: false,
            failure: "same-independence-group",
            safeMessage: "Round members must use distinct independence groups.",
        };
    }
    return { ok: true };
}
export function assertAgentTaskRoundMembersIndependent(member, other) {
    const result = compareAgentTaskRoundMembers(member, other);
    if (!result.ok)
        throw new Error(result.safeMessage);
}
export function agentTaskRoundMemberFingerprint(member) {
    return [
        member.id,
        member.adapterId,
        member.agentType,
        member.provider,
        member.model,
        member.independenceGroup,
    ].map(fingerprintSegment).join("|");
}
function providerModelKey(member) {
    return `${normalized(member.provider)}:${normalized(member.model)}`;
}
function normalized(value) {
    return value.trim().toLowerCase();
}
function fingerprintSegment(value) {
    const text = normalized(value);
    return `${text.length}:${text}`;
}
//# sourceMappingURL=rounds.js.map