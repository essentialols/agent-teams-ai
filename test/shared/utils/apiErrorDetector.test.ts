import { isApiErrorMessage } from '@shared/utils/apiErrorDetector';
import { describe, expect, it } from 'vitest';

describe('apiErrorDetector', () => {
  it('detects provider quota and rate-limit output', () => {
    expect(isApiErrorMessage('API Error: 429 {"error":"rate_limit"}')).toBe(true);
    expect(isApiErrorMessage("You're out of extra usage \\u00b7 resets 11:50pm (Europe/Kiev)")).toBe(
      true
    );
    expect(isApiErrorMessage('Provider returned rate-limited response')).toBe(true);
    expect(isApiErrorMessage('Quota exhausted for this account')).toBe(true);
  });

  it('does not flag normal lead thoughts', () => {
    expect(isApiErrorMessage('OK, I received this and will continue.')).toBe(false);
  });
});
