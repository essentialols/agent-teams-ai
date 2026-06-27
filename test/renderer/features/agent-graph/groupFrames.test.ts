import { describe, expect, it } from 'vitest';

import {
  getGroupFrameLabelScaleZoom,
  shouldRenderGroupFrameLabel,
} from '../../../../packages/agent-graph/src/canvas/group-frames';

import type { GraphGroupFrame } from '@claude-teams/agent-graph';

function groupFrame(overrides: Partial<GraphGroupFrame> = {}): GraphGroupFrame {
  return {
    id: 'group:platform',
    label: 'Platform Group',
    nodeIds: ['team:platform'],
    priority: 'normal',
    ...overrides,
  };
}

describe('group frame labels', () => {
  it('keeps normal group labels visible while zoomed out', () => {
    expect(shouldRenderGroupFrameLabel(groupFrame(), 0.06)).toBe(true);
    expect(shouldRenderGroupFrameLabel(groupFrame({ depth: 3 }), 0.09)).toBe(true);
  });

  it('keeps labels readable at far zoom', () => {
    expect(getGroupFrameLabelScaleZoom(0.01)).toBe(0.02);
  });
});
