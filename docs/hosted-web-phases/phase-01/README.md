# Hosted Web Phase 1

Current authority is `phase-01-pr252-provenance-fallback-router-r2`; terminal state is `HOLD`.
Accepted Phase 0 and Phase 1 history remains unchanged.

The current route preserves the exact held r3 job/task
`agent-teams-hosted-web-refactor-pr252-semantic-conflict-resolution-v17-r3`, base/`HEAD`
`3256ee3b5b8e81b144aa0a14eac1bca080c9b779`, and five-path patch SHA-256
`9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0`. The index must be empty
and untracked paths absent.

Test-only router `daa462aba1b21cdf41a05575d3967d8314d5c9a734e76f4cda5678a136ba7902`
is rejected and terminal because it did not authorize the facade correction. Prior seven-doc output
`c5f33adf53ef93ab69789a0d1f2b2041ffb2e2694f852b32e8cb189edddc8660` is rejected solely for
its non-default service-tier authorization. Neither output may be replayed or integrated.

Router authoring base `c0ade7cb040c9dea97a38ee58e667f56c0e39b8e` is immutable. The pinned
source parent is `e9ffa30cc016ad3cb833fcc0a138fa4f026eb850`; the active merge source is
`3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`.

After router acceptance/integration/push, `ProjectScopedControl` stores that pushed router commit and
continues only the same r3 job. The worker keeps `HEAD=3256ee3b...`, reads authority with
`git show <storedRouterCommit>:<path>`, and preserves the five-path patch. Only
`TaskBoardCommandFacade.ts` and `TaskBoardCommands.e2e.test.ts` may receive new bytes.

The facade correction applies only when a create error is classified as
`TaskBoardCreateDestinationConflictError` and a known task exists: call existing
`assertMatchingTask` for the exact ID and trimmed requested subject, then return the known task.
Terminal, no-known, mismatch, and other-error behavior stays intact. Provenance fields are not
compared and `taskStore` is not weakened.

Exactly two existing E2E cases receive corrected `Executed` and `Reconciled` outcomes; each reports
`createdInAttempt: false`, a `Completed` task, `attemptCount: 1`, and one task. The suite remains ten
cases, and `UNRELATED SUBJECT` remains terminal.

The continued r3 and one fresh independent reviewer use `gpt-5.6-sol`, `xhigh`, and
`serviceTier: "default"`; no machine `fastMode` field is permitted. Acceptance requires TaskBoard
`10/10`, TeamDataService `127/127`, native TypeScript `7 inherited / 0 owned / 0 unexpected`, all
checks/scans, and independent P0/P1/P2 `0/0/0`.

The authoritative dependency projection is [`execution-dag.md`](execution-dag.md). Only the ordered
true merge `[storedRouterCommit, 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]` may be committed and
pushed by the broker. P1.R2, P1.I, P1.F, and Phase 2+ remain blocked pending that validated push.
This router changes exactly seven docs, performs no lifecycle/Git mutation, and ends `HOLD`.
