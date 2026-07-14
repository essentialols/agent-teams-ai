# Hosted-web execution: start here

> Current route: `phase-01-pr252-provenance-fallback-router-r2` corrects only the held PR #252
> provenance fallback in the exact existing r3 job. Every future worker and reviewer uses
> `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`. This seven-document router launches nothing
> and ends `HOLD`.

Phase 0 and accepted Phase 1 history remain frozen. The only current executable node is
`PR252-provenance-fallback-remediation`. Root stays orchestrator; `controller-v17` stays exactly
live and is neither replaced nor restarted.

## Deterministic reading order

1. `AGENTS.md`
2. This file
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`
4. `docs/hosted-web-phases/README.md`
5. `docs/hosted-web-phases/EXECUTION_INDEX.json`
6. `docs/hosted-web-phases/phase-01/controller-packet.md`
7. `docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md`
8. `CLAUDE.md`
9. `AGENT_CRITICAL_GUARDRAILS.md`
10. `docs/hosted-web-phases/PACKET_STANDARD.md`
11. Only the five producer-owned product/test paths listed in the lane packet

Do not recursively inspect rejected job state, fetch, launch an app/runtime/team, access a real
project, or substitute a moving ref for a stored immutable target. The continued worker may inspect
only the exact existing r3 job/workspace state and immutable records named by this route.

## Current correction and rejected inputs

The held workspace remains the same job and task:
`agent-teams-hosted-web-refactor-pr252-semantic-conflict-resolution-v17-r3`. Its base and intentional
`HEAD` are `3256ee3b5b8e81b144aa0a14eac1bca080c9b779`; its empty-index five-path patch is
`9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0`.

The test-only router output
`daa462aba1b21cdf41a05575d3967d8314d5c9a734e76f4cda5678a136ba7902` is rejected and terminal:
it cannot be reused, replayed, or integrated because it did not authorize the required facade fix.
The prior seven-doc candidate
`c5f33adf53ef93ab69789a0d1f2b2041ffb2e2694f852b32e8cb189edddc8660` is also rejected and
terminal solely because it authorized a non-default service tier. Its non-tier contract is recreated
here; its bytes are not replayed.

The router authoring base is `c0ade7cb040c9dea97a38ee58e667f56c0e39b8e`. The pinned merge
source is `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`; its recorded source parent is
`e9ffa30cc016ad3cb833fcc0a138fa4f026eb850`. The broker must re-prove the exact remote source
immediately before integration and fail closed on drift.

## Same-job provenance-fallback remediation

After this router receives independent `ACCEPT`, is integrated, and is pushed,
`ProjectScopedControl` resolves that pushed target once as `storedRouterCommit`. It proves the exact
r3 job is stopped, the workspace still has `HEAD=3256ee3b...`, an empty index, no untracked path,
exactly the five owned dirty paths, and raw patch SHA-256 `9f5016c6...`. Any drift ends `HOLD`.

It then continues only that same r3 job. No refill, new job, new task, new worktree, duplicate, fetch,
checkout, reset, rebase, clean rewrite, or rejected-output replay is authorized. The workspace `HEAD`
intentionally remains `3256ee3b...`; the worker reads accepted r2 authority with
`git show <storedRouterCommit>:<path>`.

The existing five-path patch is preserved. New bytes are allowed only in
`TaskBoardCommandFacade.ts` and `TaskBoardCommands.e2e.test.ts`. On a classified
`TaskBoardCreateDestinationConflictError` with a known task, the facade calls the existing
`assertMatchingTask` with the exact requested ID and requested string subject trimmed, then returns
the known task. Terminal behavior, the no-known-task path, mismatch behavior, and every other error
remain unchanged. The fix does not compare `creationCommand`, payload hashes, `createdBy`, or
relations and does not weaken `taskStore`.

The E2E suite stays at exactly ten cases. Exactly two existing cases are corrected: their outcomes
are respectively `Executed` and `Reconciled`; both report `createdInAttempt: false`, a `Completed`
task, `attemptCount: 1`, and exactly one task. The `UNRELATED SUBJECT` case stays terminal and never
reports success.

## Review, integration, and HOLD

Both the continued worker and one fresh independent reviewer use `gpt-5.6-sol`, `xhigh`, and
`serviceTier: "default"`; no machine `fastMode` field is permitted. Required evidence is TaskBoard
`10/10`, TeamDataService `127/127`, and native TypeScript `7 inherited / 0 owned / 0 unexpected`,
plus the bounded lint, Prettier, diff, ownership, conflict, secret, private-path, and textual scans.
Only reviewer `ACCEPT` with P0/P1/P2 `0/0/0` permits broker integration.

The broker creates only the ordered true merge
`[storedRouterCommit, 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]`, reruns every final-shape
gate, creates the conventional merge commit, and pushes. P1.R2, P1.I, P1.F, and Phase 2+ remain
blocked until that validated push. This router changes exactly seven docs, keeps its index empty and
adds no untracked path, performs no lifecycle or Git mutation, and ends `HOLD`.
