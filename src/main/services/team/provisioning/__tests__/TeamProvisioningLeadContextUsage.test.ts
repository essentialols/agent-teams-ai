import { describe, expect, it } from 'vitest';

import {
  buildLeadContextUsagePayloadFromState,
  deriveLeadContextUsageStateFromUsage,
  getInitialLeadContextWindowTokensForRequest,
} from '../TeamProvisioningLeadContextUsage';

describe('lead context usage helpers', () => {
  it('builds an unavailable payload when no usage state exists', () => {
    expect(buildLeadContextUsagePayloadFromState(null, '2026-01-01T00:00:00.000Z')).toEqual({
      promptInputTokens: null,
      outputTokens: null,
      contextUsedTokens: null,
      contextWindowTokens: null,
      contextUsedPercent: null,
      promptInputSource: 'unavailable',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('calculates and clamps context usage percent', () => {
    expect(
      buildLeadContextUsagePayloadFromState(
        {
          promptInputTokens: 100,
          outputTokens: 10,
          contextUsedTokens: 15_000,
          contextWindowTokens: 10_000,
          promptInputSource: 'anthropic_usage',
        },
        '2026-01-01T00:00:00.000Z'
      ).contextUsedPercent
    ).toBe(100);

    expect(
      buildLeadContextUsagePayloadFromState(
        {
          promptInputTokens: 100,
          outputTokens: 10,
          contextUsedTokens: 2_500,
          contextWindowTokens: 10_000,
          promptInputSource: 'anthropic_usage',
        },
        '2026-01-01T00:00:00.000Z'
      ).contextUsedPercent
    ).toBe(25);
  });

  it('infers an Anthropic default context window when model is omitted', () => {
    expect(
      getInitialLeadContextWindowTokensForRequest({
        providerId: 'anthropic',
        limitContext: false,
      })
    ).toBeGreaterThan(0);
  });

  it('derives usage state while preserving requested Anthropic context window', () => {
    expect(
      deriveLeadContextUsageStateFromUsage({
        previousUsage: null,
        request: {
          providerId: 'anthropic',
          model: 'opus[1m]',
          limitContext: false,
        },
        usage: {
          input_tokens: 12,
          cache_creation_input_tokens: 34,
          cache_read_input_tokens: 56,
          output_tokens: 7,
        },
        modelName: 'claude-opus-4-6',
      })
    ).toEqual({
      promptInputTokens: 102,
      outputTokens: 7,
      contextUsedTokens: 109,
      contextWindowTokens: 1_000_000,
      promptInputSource: 'anthropic_usage',
      lastUsageMessageId: null,
      lastEmittedAt: 0,
    });
  });

  it('preserves previous context window when new usage cannot infer one', () => {
    expect(
      deriveLeadContextUsageStateFromUsage({
        previousUsage: {
          promptInputTokens: 10,
          outputTokens: 1,
          contextUsedTokens: 11,
          contextWindowTokens: 123_456,
          promptInputSource: 'anthropic_usage',
          lastUsageMessageId: 'msg-1',
          lastEmittedAt: 42,
        },
        request: {},
        usage: {
          input_tokens: 20,
          output_tokens: 2,
        },
        modelName: undefined,
      })
    ).toMatchObject({
      promptInputTokens: 20,
      outputTokens: 2,
      contextUsedTokens: 22,
      contextWindowTokens: 123_456,
      lastUsageMessageId: 'msg-1',
      lastEmittedAt: 42,
    });
  });
});
