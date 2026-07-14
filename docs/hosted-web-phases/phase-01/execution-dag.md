# Phase 1 execution DAG and ownership

Status: current revision is `phase-01-pr252-provenance-fallback-router-r2`; end `HOLD`.

## Current DAG

```text
router authoring base c0ade7cb...
  -> test-only router daa462ab... REJECTED and terminal
       -> non-default-tier seven-doc output c5f33adf... REJECTED and terminal
            -> current default-only seven-doc router review -> integration + push
                 -> store pushed router commit once
                      -> revalidate exact r3 job/task/workspace/HEAD/patch/five paths/index
                           -> exactly one SAME-JOB continuation
                                -> facade conflict fallback + two exact test corrections only
                                     -> TaskBoard 10/10 + TeamDataService 127/127
                                          -> native TS 7 inherited / 0 owned / 0 unexpected
                                               -> r3 self-review + immutable output + HOLD
                                                    -> one fresh independent default-tier reviewer
                                                         -> ACCEPT only at P0/P1/P2 0/0/0
                                                              -> revalidate pinned merge source 3b48f939...
                                                                   -> ordered broker true merge
                                                                        -> final checks + commit + push
                                                                             -X-> P1.R2 -> P1.I -> P1.F -> Phase 2+

source lineage:
e9ffa30c... (recorded parent) -> 3b48f939... (pinned merge source)
```

Root remains orchestrator. `controller-v17` remains exactly live; replacement and restart are not
edges. This docs router launches no edge.

## Proven identities

| Record                   | Identity                                                           | Authority                                |
| ------------------------ | ------------------------------------------------------------------ | ---------------------------------------- |
| Router authoring base    | `c0ade7cb040c9dea97a38ee58e667f56c0e39b8e`                         | immutable seven-doc base                 |
| R3 workspace base/HEAD   | `3256ee3b5b8e81b144aa0a14eac1bca080c9b779`                         | preserved target-side merge baseline     |
| Existing r3 patch        | `9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0` | preserved held five-path snapshot        |
| Rejected test-only route | `daa462aba1b21cdf41a05575d3967d8314d5c9a734e76f4cda5678a136ba7902` | terminal; no reuse                       |
| Rejected tier route      | `c5f33adf53ef93ab69789a0d1f2b2041ffb2e2694f852b32e8cb189edddc8660` | terminal; tier-only rejection provenance |
| Source parent            | `e9ffa30cc016ad3cb833fcc0a138fa4f026eb850`                         | immutable source lineage                 |
| Merge source             | `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`                         | pinned second parent                     |
| Merge conflicts          | exact five producer-owned paths                                    | active conflict route                    |

## Capacity, scope, and transition

Exactly one continuation of the existing r3 job, then one fresh reviewer, is permitted. Both use
`gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`. Machine request envelopes omit `fastMode`.
The reviewed dirty scope is exactly:

1. `src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts`
2. `src/main/services/team/TeamDataService.ts`
3. `src/renderer/components/team/TeamDetailView.tsx`
4. `test/features/task-board-commands/TaskBoardCommands.e2e.test.ts`
5. `test/main/services/team/TeamDataService.test.ts`

Only paths 1 and 4 may receive new bytes. The facade adds the classified-conflict known-task
`assertMatchingTask` guard; the E2E file corrects exactly two existing cases. Paths 2, 3, and 5 and
all unrelated hunks stay byte-identical to the held patch. The workspace stays at `HEAD=3256ee3b...`,
reads authority via `git show <storedRouterCommit>:<path>`, and keeps an empty index and no untracked
path.

New jobs, tasks, worktrees, duplicate starts, fetch, checkout, reset, rebase, clean rewrite,
rejected-output replay, provenance-field comparison, task-store weakening, or staging are not DAG
edges.

The worker and reviewer require TaskBoard `10/10`, TeamDataService `127/127`, native TypeScript
`7 inherited / 0 owned / 0 unexpected`, bounded lint and Prettier, index/diff checks, exact ownership,
and classified conflict, secret, private-path, and binary scans. Broker integration creates only
`[storedRouterCommit, 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]`, reruns every gate, commits,
and pushes.

P1.R2, P1.I, P1.F, and Phase 2+ remain blocked until the validated true merge is pushed. Terminal
state: `HOLD`.
