# Hosted Web execution router

> Current authority: `phase-01-pr252-provenance-fallback-router-r2` conditionally routes one
> continuation of the exact held r3 job, followed by one fresh independent reviewer. Every future
> job is `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`. This docs transition launches nothing and
> ends `HOLD`.

Always begin with [`START_HERE.md`](START_HERE.md). Machine-readable authority is
[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json); the current Phase 1 controller and lane packets are
the only executable packets.

## Current route

The exact held job/task is
`agent-teams-hosted-web-refactor-pr252-semantic-conflict-resolution-v17-r3`. Its workspace remains at
base/`HEAD` `3256ee3b5b8e81b144aa0a14eac1bca080c9b779` with an empty index, no untracked paths,
and the five-path raw patch
`9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0`.

Rejected test-only router
`daa462aba1b21cdf41a05575d3967d8314d5c9a734e76f4cda5678a136ba7902` is terminal because it
omitted the required source change. Prior seven-doc output
`c5f33adf53ef93ab69789a0d1f2b2041ffb2e2694f852b32e8cb189edddc8660` is terminal solely for
authorizing a non-default tier. Neither rejected output is a patch carrier or implementation input.

The router authoring base is `c0ade7cb040c9dea97a38ee58e667f56c0e39b8e`. The immutable source
parent is `e9ffa30cc016ad3cb833fcc0a138fa4f026eb850`, and the pinned merge source is
`3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`.

## Authorized successor

After this exact seven-document router is independently accepted, integrated, and pushed,
`ProjectScopedControl` resolves its pushed SHA once as `storedRouterCommit`, revalidates the exact
held r3 workspace snapshot, and continues that same r3 job exactly once. It creates no job, task,
workspace, worktree, or duplicate.

The worker keeps `HEAD=3256ee3b...`, reads router authority only with
`git show <storedRouterCommit>:<path>`, and preserves the existing five-path patch. New bytes are
allowed only in `TaskBoardCommandFacade.ts` and `TaskBoardCommands.e2e.test.ts`.

When a create failure is classified as `TaskBoardCreateDestinationConflictError` and a known task
exists, the facade calls the existing `assertMatchingTask` using the exact requested ID and trimmed
requested subject before returning that task. The no-known, mismatch, terminal, and other-error paths
are preserved. No `creationCommand`, payload-hash, `createdBy`, or relation comparison is introduced,
and `taskStore` is not weakened.

The TaskBoard suite remains exactly ten cases. Exactly two existing cases change to the respective
`Executed` and `Reconciled` outcomes; each has `createdInAttempt: false`, `Completed`,
`attemptCount: 1`, and one task. `UNRELATED SUBJECT` remains terminal.

## Review, integration, and HOLD

The continued r3 self-review ends `HOLD`. Exactly one fresh independent reviewer follows with
`gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`; no machine `fastMode` field is accepted. It
must independently prove `10/10`, `127/127`, native TypeScript `7 inherited / 0 owned / 0
unexpected`, all checks/scans, and return `ACCEPT` with P0/P1/P2 `0/0/0`.

Only then may the broker revalidate the pinned source and create the ordered true merge
`[storedRouterCommit, 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]`, rerun final-shape gates,
commit, and push. P1.R2, P1.I, P1.F, and Phase 2+ stay blocked until that push. The docs author
performs no fetch, stage, commit, merge, push, lifecycle action, or real-project access. End `HOLD`.
