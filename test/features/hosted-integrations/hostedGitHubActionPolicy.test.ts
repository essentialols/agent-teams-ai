import {
  buildTrustedAgentGithubActionEnvelope,
  createStableGithubActionRequestId,
  HostedIntegrationDomainError,
  redactHostedIntegrationSecrets,
  toPolicySubjectId,
} from '@features/hosted-integrations/core/domain';

describe('hosted GitHub action policy', () => {
  it('builds trusted envelopes with normalized policy subject ids and attribution', () => {
    const envelope = buildTrustedAgentGithubActionEnvelope({
      actionType: 'github.issue_comment.create',
      localAttemptId: 'attempt-1',
      payload: { body: 'Ready for review' },
      requestId: 'github-action:attempt-1',
      targetId: 'target_1',
      runtimeMember: {
        agentId: 'Reviewer Bot',
        agentName: 'Reviewer Bot',
        avatarUrl: 'https://example.com/avatar.png',
        teamId: 'Core Team',
        teamName: 'Core Team',
      },
    });

    expect(envelope.requestedBy).toEqual({
      subjectKind: 'agent',
      subjectId: 'agent:reviewer-bot',
      agentId: 'agent:reviewer-bot',
      teamId: 'team:core-team',
    });
    expect(envelope.attribution).toEqual({
      agentDisplayName: 'Reviewer Bot',
      agentAvatarUrl: 'https://example.com/avatar.png',
      teamDisplayName: 'Core Team',
    });
  });

  it('keeps raw ids and display names separated through subject normalization', () => {
    expect(toPolicySubjectId('agent', 'agent:stable_agent')).toBe('agent:stable_agent');
    expect(toPolicySubjectId('team', 'Frontend Team')).toBe('team:frontend-team');
  });

  it('rejects reserved markers, unsafe avatars, and oversized bodies before submission', () => {
    const base = {
      actionType: 'github.issue_comment.create' as const,
      localAttemptId: 'attempt-1',
      requestId: 'request-1',
      targetId: 'target_1',
      runtimeMember: {
        agentName: 'Agent',
        teamName: 'Team',
      },
    };

    expect(() =>
      buildTrustedAgentGithubActionEnvelope({
        ...base,
        payload: { body: '<!-- agent-teams-action:abc -->' },
      })
    ).toThrow(HostedIntegrationDomainError);

    expect(() =>
      buildTrustedAgentGithubActionEnvelope({
        ...base,
        payload: { body: 'ok' },
        runtimeMember: { ...base.runtimeMember, avatarUrl: 'file:///tmp/avatar.png' },
      })
    ).toThrow(HostedIntegrationDomainError);

    expect(() =>
      buildTrustedAgentGithubActionEnvelope({
        ...base,
        payload: { body: 'x'.repeat(60_000) },
      })
    ).toThrow(HostedIntegrationDomainError);
  });

  it('creates stable action request ids for idempotent retries', () => {
    expect(
      createStableGithubActionRequestId({
        actionType: 'github.issue_comment.create',
        localAttemptId: 'Run 1',
        payloadFingerprint: 'sha256:abcd',
        targetId: 'Target 1',
      })
    ).toBe('github-action:run-1:target-1:github.issue_comment.create:sha256:abcd');
  });

  it('redacts hosted credentials and callback secrets from log text', () => {
    expect(
      redactHostedIntegrationSecrets(
        'Bearer agtcp_secret code=oauth-code claimContinuationToken: token-value'
      )
    ).toBe('Bearer [redacted] code=[redacted] claimContinuationToken=[redacted]');
  });
});
