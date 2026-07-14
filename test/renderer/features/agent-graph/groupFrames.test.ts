import { describe, expect, it } from 'vitest';

import {
  getGroupFrameLabelBounds,
  getGroupFrameLabelPlacement,
  getGroupFrameLabelScaleZoom,
  getGroupFrameLabelVerticalOffsetPx,
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
    expect(shouldRenderGroupFrameLabel(groupFrame(), 0.02)).toBe(true);
    expect(shouldRenderGroupFrameLabel(groupFrame(), 0.06)).toBe(true);
    expect(shouldRenderGroupFrameLabel(groupFrame({ depth: 3 }), 0.02)).toBe(false);
    expect(shouldRenderGroupFrameLabel(groupFrame({ depth: 3 }), 0.2)).toBe(true);
  });

  it('reserves a second overview line for aggregate counts', () => {
    const frame = groupFrame({ semanticSummary: '12 teams · 4 active · 18 tasks' });
    const singleLine = getGroupFrameLabelBounds(
      frame.label,
      { left: 0, top: 0, right: 1000, bottom: 800 },
      0.1
    );
    const aggregate = getGroupFrameLabelBounds(
      frame.label,
      { left: 0, top: 0, right: 1000, bottom: 800 },
      0.1,
      undefined,
      { secondaryLabel: frame.semanticSummary }
    );

    expect(aggregate.height).toBeGreaterThan(singleLine.height);
    expect(aggregate.secondaryTextY).toBeGreaterThan(aggregate.textY);
  });

  it('keeps labels readable at far zoom', () => {
    expect(getGroupFrameLabelScaleZoom(0.01)).toBe(0.015);
  });

  it('places group labels inside the frame instead of on the border', () => {
    const frame = groupFrame();
    const frameBounds = { left: 0, top: 100, right: 4000, bottom: 3000 };
    const labelBounds = getGroupFrameLabelBounds(frame.label, frameBounds, 0.02, undefined, {
      placement: getGroupFrameLabelPlacement(frame),
      verticalOffsetPx: getGroupFrameLabelVerticalOffsetPx(frame),
    });

    expect(labelBounds.top).toBeGreaterThan(frameBounds.top);
  });

  it('keeps organization labels outside the frame', () => {
    const frame = groupFrame({ priority: 'primary' });
    const frameBounds = { left: 0, top: 100, right: 4000, bottom: 3000 };
    const labelBounds = getGroupFrameLabelBounds(frame.label, frameBounds, 0.02, undefined, {
      placement: getGroupFrameLabelPlacement(frame),
      verticalOffsetPx: getGroupFrameLabelVerticalOffsetPx(frame),
    });

    expect(labelBounds.bottom).toBeLessThan(frameBounds.top);
  });

  it('places labels for nested groups near the bottom edge', () => {
    const frame = groupFrame({ depth: 1 });
    const frameBounds = { left: 0, top: 100, right: 4000, bottom: 3000 };
    const labelBounds = getGroupFrameLabelBounds(frame.label, frameBounds, 0.02, undefined, {
      placement: getGroupFrameLabelPlacement(frame),
      verticalOffsetPx: getGroupFrameLabelVerticalOffsetPx(frame),
    });

    expect(labelBounds.bottom).toBeLessThan(frameBounds.bottom);
    expect(labelBounds.top).toBeGreaterThan(frameBounds.top);
  });
});
