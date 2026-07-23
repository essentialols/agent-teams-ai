# Change Review

This is a thin renderer feature extracted incrementally from the legacy
`ChangeReviewDialog` shell.

- `renderer/view-models` owns pure presentation projections.
- `renderer/utils` owns pure scope and operation-generation policies.
- `renderer/hooks` owns scope/lifecycle, draft history, conflict recovery, action-history,
  decision-persistence, keyboard orchestration, and durable Undo/Redo/checkpoint Restore through
  narrow command, state, and view ports.
- `renderer/ui` owns store-free presentation components.
- The legacy dialog remains the temporary composition shell for Zustand, editor mutations,
  forward Accept/Reject disk mutations, and outer close coordination while later slices move
  those responsibilities behind focused hooks and use cases.

Production callers import through `@features/change-review/renderer`.
