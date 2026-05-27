import { hostedIntegrationError, throwHostedIntegrationError } from './hostedIntegrationErrors';

export interface NormalizedControlPlaneBaseUrl {
  readonly href: string;
  readonly origin: string;
  readonly isLocalDevelopment: boolean;
}

const BLOCKED_HOSTS = new Set(['169.254.169.254', 'metadata.google.internal']);
const LOCALHOST_NAMES = new Set(['localhost']);
const ALLOWED_GITHUB_SETUP_HOSTS = new Set(['github.com', 'www.github.com']);

export function normalizeControlPlaneBaseUrl(
  rawUrl: string,
  options: { allowLocalhostHttp?: boolean } = {}
): NormalizedControlPlaneBaseUrl {
  const input = rawUrl.trim();
  if (!input) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_BASE_URL_REQUIRED',
        'Control-plane URL is required.',
        'configuration'
      )
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_BASE_URL_INVALID',
        'Control-plane URL is invalid.',
        'configuration'
      )
    );
  }

  if (parsed.username || parsed.password) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_BASE_URL_HAS_CREDENTIALS',
        'Control-plane URL must not contain credentials.',
        'security'
      )
    );
  }

  if (parsed.hash) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_BASE_URL_HAS_FRAGMENT',
        'Control-plane URL must not contain a fragment.',
        'security'
      )
    );
  }

  const isLocalDevelopment = isLocalhost(parsed.hostname);
  const allowLocalhostHttp = options.allowLocalhostHttp === true;
  if (
    parsed.protocol !== 'https:' &&
    !(allowLocalhostHttp && parsed.protocol === 'http:' && isLocalDevelopment)
  ) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_BASE_URL_SCHEME_REJECTED',
        'Control-plane URL must use HTTPS outside localhost development.',
        'security'
      )
    );
  }

  if (isBlockedNetworkHost(parsed.hostname) && !isLocalDevelopment) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_BASE_URL_HOST_REJECTED',
        'Control-plane URL host is not allowed.',
        'security'
      )
    );
  }

  parsed.hash = '';
  parsed.search = '';
  const pathname = normalizeBasePath(parsed.pathname);
  parsed.pathname = pathname;
  return {
    href: parsed.href,
    origin: parsed.origin,
    isLocalDevelopment,
  };
}

export function assertTokenBearingRequestUrl(
  baseUrl: NormalizedControlPlaneBaseUrl,
  requestUrl: string
): URL {
  const parsed = new URL(requestUrl, baseUrl.href);
  if (parsed.origin !== baseUrl.origin) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_TOKEN_DESTINATION_REJECTED',
        'Refusing to send hosted integration credentials to a different origin.',
        'security'
      )
    );
  }
  return parsed;
}

export function assertHostedSetupUrlAllowed(
  baseUrl: NormalizedControlPlaneBaseUrl,
  setupUrl: string
): URL {
  let parsed: URL;
  try {
    parsed = new URL(setupUrl);
  } catch {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_SETUP_URL_INVALID',
        'Setup URL is invalid.',
        'security'
      )
    );
  }

  if (
    parsed.protocol !== 'https:' &&
    !(baseUrl.isLocalDevelopment && parsed.protocol === 'http:' && isLocalhost(parsed.hostname))
  ) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_SETUP_URL_SCHEME_REJECTED',
        'Setup URL scheme is not allowed.',
        'security'
      )
    );
  }

  const isControlPlaneUrl = parsed.origin === baseUrl.origin;
  const isGitHubSetupUrl =
    parsed.protocol === 'https:' && ALLOWED_GITHUB_SETUP_HOSTS.has(parsed.hostname.toLowerCase());
  if (!isControlPlaneUrl && !isGitHubSetupUrl) {
    throwHostedIntegrationError(
      hostedIntegrationError(
        'HOSTED_INTEGRATION_SETUP_URL_ORIGIN_REJECTED',
        'Setup URL origin is not allowed.',
        'security'
      )
    );
  }
  return parsed;
}

function normalizeBasePath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

function isLocalhost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return LOCALHOST_NAMES.has(host) || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

function isBlockedNetworkHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^127\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (host === '::1' || host === '[::1]') return true;
  if (/^fc/i.test(host) || /^fd/i.test(host)) return true;
  return false;
}
