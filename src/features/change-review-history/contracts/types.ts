/** JSON-safe value used by the CodeMirror state codec across the preload boundary. */
export type ReviewDraftHistoryJsonValue =
  | null
  | boolean
  | number
  | string
  | ReviewDraftHistoryJsonValue[]
  | { [key: string]: ReviewDraftHistoryJsonValue };

/**
 * Versioned CodeMirror state cache. The `doc` and `history` fields are mandatory so a
 * malformed or partial checkpoint can never be mistaken for a recoverable draft.
 */
export interface ReviewSerializedEditorState {
  doc: string;
  history: ReviewDraftHistoryJsonValue;
  [key: string]: ReviewDraftHistoryJsonValue;
}

/** One exact-scope, per-file manual edit checkpoint. */
export interface ReviewDraftHistoryEntry {
  filePath: string;
  codec: 'codemirror-history-v1';
  /** Monotonic per-file revision. Equal revisions are accepted only when idempotent. */
  revision: number;
  /** Opaque durable generation token used to prevent revision ABA after Clear + recreate. */
  generation: string;
  /** Exact disk content on which the current editor branch is based; null means absent. */
  diskBaseline: string | null;
  /** Full native editor state, including CodeMirror's done and undone history branches. */
  editorState: ReviewSerializedEditorState;
  updatedAt: string;
}

export interface ReviewDraftHistorySnapshot {
  entries: Record<string, ReviewDraftHistoryEntry>;
}
