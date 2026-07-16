import { describe, expect, it } from 'vitest';

import { shouldShowOpenCodeNeedsTestBadge } from './teamModelSelectorUi';

describe('shouldShowOpenCodeNeedsTestBadge', () => {
  it.each(['cursor-acp', 'kiro'])(
    'hides the needs-test badge for the %s OpenCode source',
    (sourceId) => {
      expect(shouldShowOpenCodeNeedsTestBadge('needs_probe', sourceId)).toBe(false);
    }
  );

  it('keeps the needs-test badge for other OpenCode sources', () => {
    expect(shouldShowOpenCodeNeedsTestBadge('needs_probe', 'opencode-config')).toBe(true);
  });

  it('does not show the badge for other proof states', () => {
    expect(shouldShowOpenCodeNeedsTestBadge('verified', 'cursor-acp')).toBe(false);
  });
});
