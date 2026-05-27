import {
  assertHostedSetupUrlAllowed,
  assertTokenBearingRequestUrl,
  HostedIntegrationDomainError,
  normalizeControlPlaneBaseUrl,
} from '@features/hosted-integrations/core/domain';

describe('hosted integration URL policy', () => {
  it('normalizes HTTPS control-plane base URLs', () => {
    const normalized = normalizeControlPlaneBaseUrl(
      'https://cp.example.com/root/?token=nope#frag'.replace('#frag', '')
    );

    expect(normalized.href).toBe('https://cp.example.com/root/');
    expect(normalized.origin).toBe('https://cp.example.com');
    expect(normalized.isLocalDevelopment).toBe(false);
  });

  it('rejects credentials, fragments, and non-local HTTP base URLs', () => {
    expect(() => normalizeControlPlaneBaseUrl('https://user:pass@example.com')).toThrow(
      HostedIntegrationDomainError
    );
    expect(() => normalizeControlPlaneBaseUrl('https://example.com/#secret')).toThrow(
      HostedIntegrationDomainError
    );
    expect(() => normalizeControlPlaneBaseUrl('http://example.com')).toThrow(
      HostedIntegrationDomainError
    );
  });

  it('allows localhost HTTP only when explicit local development is enabled', () => {
    expect(
      normalizeControlPlaneBaseUrl('http://127.0.0.1:4173', { allowLocalhostHttp: true }).origin
    ).toBe('http://127.0.0.1:4173');
    expect(() => normalizeControlPlaneBaseUrl('http://127.0.0.1:4173')).toThrow(
      HostedIntegrationDomainError
    );
  });

  it('rejects token-bearing requests to a different origin', () => {
    const base = normalizeControlPlaneBaseUrl('https://cp.example.com');

    expect(assertTokenBearingRequestUrl(base, '/api/desktop/v1/me').href).toBe(
      'https://cp.example.com/api/desktop/v1/me'
    );
    expect(() => assertTokenBearingRequestUrl(base, 'https://evil.example.com/api')).toThrow(
      HostedIntegrationDomainError
    );
  });

  it('allowlists setup URLs to the configured control-plane or GitHub only', () => {
    const base = normalizeControlPlaneBaseUrl('https://cp.example.com');

    expect(assertHostedSetupUrlAllowed(base, 'https://cp.example.com/setup').origin).toBe(
      'https://cp.example.com'
    );
    expect(assertHostedSetupUrlAllowed(base, 'https://github.com/apps/agent-teams').origin).toBe(
      'https://github.com'
    );
    expect(() => assertHostedSetupUrlAllowed(base, 'javascript:alert(1)')).toThrow(
      HostedIntegrationDomainError
    );
    expect(() => assertHostedSetupUrlAllowed(base, 'https://evil.example.com/setup')).toThrow(
      HostedIntegrationDomainError
    );
  });
});
