import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeMirrorDiffView } from '../../../../../src/renderer/components/team/review/CodeMirrorDiffView';

import type { EditorView } from '@codemirror/view';

vi.mock('@features/localization/renderer', () => ({
  useAppTranslation: () => ({ t: (key: string) => key }),
}));

describe('CodeMirrorDiffView draft propagation', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('publishes a draft synchronously and preserves it when editor extensions rebuild', async () => {
    const root = createRoot(container);
    const observed: string[] = [];
    const observedPrevious: Array<string | undefined> = [];
    let view: EditorView | null = null;
    const requireView = (): EditorView => {
      if (!view) throw new Error('CodeMirror view was not mounted');
      return view;
    };
    const renderEditor = (readOnly: boolean, showMergeControls = true): React.ReactElement => (
      <CodeMirrorDiffView
        original={'const value = 1;\n'}
        modified={'const value = 2;\n'}
        fileName="file.txt"
        readOnly={readOnly}
        showMergeControls={showMergeControls}
        collapseUnchanged={false}
        onContentChanged={(content, previousContent) => {
          observed.push(content);
          observedPrevious.push(previousContent);
        }}
        onViewChange={(nextView) => {
          view = nextView;
        }}
      />
    );

    await act(async () => root.render(renderEditor(false)));
    expect(view).not.toBeNull();

    const editableView = requireView();
    const draft = `${editableView.state.doc.toString()}// manual draft\n`;
    editableView.dispatch({
      changes: { from: editableView.state.doc.length, insert: '// manual draft\n' },
    });

    // No timer/microtask advance: guards can see the draft before a collapse/reject click.
    expect(observed).toEqual([draft]);
    expect(observedPrevious).toEqual(['const value = 2;\n']);

    // A parent hides review controls as soon as a draft exists. That prop-only update must not
    // recreate CodeMirror, otherwise the first keypress resets selection/history.
    await act(async () => root.render(renderEditor(false, false)));
    expect(view).toBe(editableView);
    expect(requireView().state.doc.toString()).toBe(draft);

    await act(async () => root.render(renderEditor(true, false)));
    expect(requireView().state.doc.toString()).toBe(draft);

    await act(async () => root.unmount());
    expect(observed.at(-1)).toBe(draft);
  });
});
