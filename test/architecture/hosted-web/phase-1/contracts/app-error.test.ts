import * as hosted from '@shared/contracts/hosted';

import valid from './fixtures/valid-contract-values.json';
test('hosted errors freeze safe fields and reject unsafe or transport-shaped values', () => {
  expect(hosted.APP_ERROR_CODES.join(',')).toBe(
    'invalid_request,unauthenticated,forbidden,not_found,conflict,unsupported,unavailable,cancelled,internal'
  );
  expect(Object.isFrozen(hosted.APP_ERROR_CODES)).toBe(true);
  expect(hosted.createSafeAppError(valid.safeError)).toEqual(valid.safeError);
  for (const reason of ['Raw message', 'source/unavailable']) {
    expect(() => hosted.createSafeAppError({ code: 'internal', reason })).toThrow();
  }
  for (const retryAfterMs of [0, 60_001]) {
    expect(() =>
      hosted.createSafeAppError({ code: 'unavailable', reason: 'retry', retryAfterMs })
    ).toThrow();
  }
  expect(() =>
    hosted.createSafeAppError({ code: 'internal', reason: 'unexpected', status: 500 })
  ).toThrow();
  expect(() =>
    hosted.createSafeAppError({ code: 'internal', reason: 'unexpected', retryAfterMs: 1 })
  ).toThrow();
  expect(() => hosted.createSafeAppError({ code: 'other', reason: 'unexpected' })).toThrow();
});
