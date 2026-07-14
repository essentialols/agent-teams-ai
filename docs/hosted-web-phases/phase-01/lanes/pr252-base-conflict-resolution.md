# PR #252 provenance-fallback same-job continuation lane

## Authority

- Phase/node: `phase-01` / `PR252-provenance-fallback-remediation`
- Lane: `pr252-provenance-fallback-remediation`
- Revision: `phase-01-pr252-provenance-fallback-router-r2`
- Root: orchestrator only
- Durable controller: `controller-v17`, exactly `live=true`; no replacement or restart
- Admission/integration owner: `ProjectScopedControl`
- Producer continuation: the existing r3 job only
- Reviewer: one fresh `codex_goal_project_prepare_verifier`, `workerRole: reviewer`,
  `reviewKind: review`
- Every future profile: `gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`; omit `fastMode`
- Conditional capacity: one same-job held r3 continuation, then one fresh independent reviewer
- Router and continued-r3 terminal state: `HOLD`

No worker starts until this exact seven-document router is independently accepted, integrated, and
pushed. This docs author starts none.

## Immutable route inputs

The exact router authoring base is
`c0ade7cb040c9dea97a38ee58e667f56c0e39b8e`. The continued producer is not a new worker. It is the
same existing job and task
`agent-teams-hosted-web-refactor-pr252-semantic-conflict-resolution-v17-r3` in workspace
`/var/data/agent-teams-hosted-web-refactor/worktrees/pr252-semantic-conflict-resolution-v17-r3`.
Its base and intentional `HEAD` are
`3256ee3b5b8e81b144aa0a14eac1bca080c9b779`.

Immediately before continuation, the workspace must still have an empty index, no untracked path,
the exact five dirty paths below, and raw `git diff` SHA-256
`9f5016c669ab777a80d1395352ee7e51d945e2409a3d43efa4735dea8d23b2a0`. Any drift ends `HOLD`.

Two rejected router outputs are retained only as terminal provenance:

| Record                           | SHA-256                                                            | Disposition                                    |
| -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| Test-only correction router      | `daa462aba1b21cdf41a05575d3967d8314d5c9a734e76f4cda5678a136ba7902` | rejected; omitted required facade fix          |
| Prior seven-doc tier declaration | `c5f33adf53ef93ab69789a0d1f2b2041ffb2e2694f852b32e8cb189edddc8660` | rejected solely for non-default tier authority |

Neither rejected output is an implementation input, patch carrier, replay source, or integration
candidate. The current router recreates the second output's non-tier contract on `c0ade7cb...` and
authorizes only the default service tier.

## Source and merge authority

The recorded immutable source parent is
`e9ffa30cc016ad3cb833fcc0a138fa4f026eb850`. The pinned active merge source and required second
parent is `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95` on
`origin/refactor/team-provisioning-round2-reapply`.

Immediately before integration, the broker reruns:

```bash
git ls-remote origin refs/heads/refactor/team-provisioning-round2-reapply
```

The single returned branch head must be exactly `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`.
A missing, additional, or different result ends `HOLD`; fetching a replacement or silently rebinding
is forbidden. The conflict route remains exactly the five owned paths below.

## Stored target and same-job continuation

After this router's independent acceptance, integration, and push, `ProjectScopedControl` resolves
its pushed full SHA exactly once as `storedRouterCommit`. That value binds the worker authority read,
reviewer target, `mark_reviewed` target, integration target, and the true merge's first parent. It is
not the r3 workspace `HEAD` and is never re-resolved.

Immediately before continuation, the controller proves in one snapshot:

1. This r2 router is accepted, integrated, pushed, and resolved once as `storedRouterCommit`.
2. The exact r3 job and task exist, point to the exact workspace, are not active, and have no
   continuation in flight.
3. The job profile is `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`.
4. Workspace base and `HEAD` are `3256ee3b...`; the index is empty; untracked paths are empty.
5. The dirty paths equal the exact ordered five-path list and raw patch hash equals `9f5016c6...`.
6. Source parent, merge source, and exact five-conflict authority have not drifted.

Any mismatch ends `HOLD`. If every check passes, `ProjectScopedControl` continues exactly the named
r3 job once with `forceStart=true`, `confirmStart=true`, and `dependencyBootstrap=install`. It does
not refill or create a job, task, prompt-owned workspace, worktree, or parallel producer. An
already-running or duplicate result fails closed.

The workspace `HEAD` intentionally stays at `3256ee3b...`. Every accepted router authority path is
read with `git show <storedRouterCommit>:<path>`; fetch, checkout, reset, rebase, or any other `HEAD`
movement is forbidden.

## Mandatory reads

Read accepted router bytes in this order:

1. `AGENTS.md`
2. `docs/hosted-web-phases/START_HERE.md`
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`
4. `docs/hosted-web-phases/README.md`
5. `docs/hosted-web-phases/EXECUTION_INDEX.json`
6. `docs/hosted-web-phases/phase-01/controller-packet.md`
7. This lane packet
8. `CLAUDE.md`
9. `AGENT_CRITICAL_GUARDRAILS.md`
10. `docs/hosted-web-phases/PACKET_STANDARD.md`
11. The exact five current dirty workspace paths

The worker does not recursively inspect rejected job state or unrelated product, test, research, or
evidence paths.

## Exact exclusive producer scope

The complete ordered `ownedPaths` list and legal conflict set is:

1. `src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts`
2. `src/main/services/team/TeamDataService.ts`
3. `src/renderer/components/team/TeamDetailView.tsx`
4. `test/features/task-board-commands/TaskBoardCommands.e2e.test.ts`
5. `test/main/services/team/TeamDataService.test.ts`

The existing five-path patch is preserved. New bytes are allowed only in paths 1 and 4 for the
named facade correction and two exact E2E expectation corrections. Paths 2, 3, and 5 stay
byte-identical to their `9f5016c6...` patch sections. Existing unrelated hunks in paths 1 and 4 also
stay intact. There is no compile-coherence exception and no sixth path.

## Required facade semantics

1. Preserve the existing error classifier and existing `assertMatchingTask`; do not add a parallel
   classifier, compatibility shim, or second matcher.
2. Only after a create error is classified as `TaskBoardCreateDestinationConflictError`, if a known
   task exists, call existing `assertMatchingTask` with that task, the exact requested task ID, and
   the requested payload whose string subject is compared after trimming.
3. Return the known task only after `assertMatchingTask` succeeds. Same ID alone never proves a
   match.
4. Preserve the existing terminal behavior and the no-known-task path. A missing known task cannot
   become a success.
5. Preserve mismatch behavior: ID mismatch or trimmed requested-subject mismatch throws
   `TaskBoardCreateDestinationConflictError`, classifies `Terminal`, and never reports success.
6. Preserve every other-error path byte-for-byte in behavior. Non-classified errors are not
   reconciled or converted into success.
7. Do not require or compare `creationCommand`, `payloadHash`, `createdBy`, or relations. Those are
   not provenance requirements for this fallback.
8. Do not weaken, widen, replace, or bypass `taskStore`. Keep its validation, persistence, writer
   authority, and failure behavior intact.

## Required E2E semantics

The suite has exactly ten cases before and after the correction. Do not add an eleventh case or
remove, merge, skip, rename away, or broaden an existing case.

Correct exactly two existing cases and no others:

1. The direct known-task fallback case reports outcome `Executed`.
2. The destination-reconciliation case reports outcome `Reconciled`.

Both corrected cases must prove all of:

- `createdInAttempt: false`;
- returned task status `Completed`;
- `attemptCount: 1`;
- exactly one task exists.

The existing subject `UNRELATED SUBJECT` regression remains terminal. It has no success outcome,
does not create a second task, and proves the known task cannot be returned when its ID or trimmed
subject mismatches the request.

## Continued-worker and reviewer gates

Run independently in the held continuation and the fresh reviewer materialization:

```bash
git diff --cached --quiet
test -z "$(git ls-files --others --exclude-standard)"
pnpm exec vitest run test/features/task-board-commands/TaskBoardCommands.e2e.test.ts
pnpm exec vitest run test/main/services/team/TeamDataService.test.ts
node scripts/hosted-web/phase-0/final-gate/normalize-typescript-diagnostics.mjs --mode milestone
pnpm lint:fast:files -- src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
pnpm exec prettier --check src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts src/main/services/team/TeamDataService.ts src/renderer/components/team/TeamDetailView.tsx test/features/task-board-commands/TaskBoardCommands.e2e.test.ts test/main/services/team/TeamDataService.test.ts
git diff --check
```

Required exact results:

- TaskBoardCommands E2E: `10/10` cases and tests pass;
- TeamDataService: `127/127` tests pass;
- native TypeScript: `7 inherited / 0 owned / 0 unexpected` diagnostics.

The seven inherited native diagnostics are exactly:

- `auth-artifacts-spike.test.ts`: TS7016 at 25:8; TS7031 at 66:31; TS18046 at 117:68; TS7031 at
  413:48; TS7031 at 733:10;
- `evidence-scanner.test.ts`: TS7016 at 12:8; and
- `scan-runtime-surfaces.test.ts`: TS2352 at 162:44.

Any added, removed, moved, or changed diagnostic fails.

Also prove exact workspace/job/base/patch bindings, five-path ownership, preserved patch sections,
new-byte restriction, ten-case static count, exactly two corrected cases, classified-conflict
control flow, existing matcher call, terminal `UNRELATED SUBJECT`, no provenance-field comparison,
no task-store weakening, and classified conflict-marker, secret/auth/provider, private/user/real-
project-path, and textual/non-binary scans over all five owned paths. Every match is classified.

The worker self-reviews with explicit P0/P1/P2 counts, emits one immutable runtime-owned output with
`nextAction: "integration-review"`, and returns `HOLD`. It does not start the reviewer or authorize
integration.

## Independent review

After continued r3 `HOLD`, `ProjectScopedControl` admits exactly one fresh independent reviewer. The
reviewer is independent of the router author, continued r3, rejected test-only router, rejected
non-default-tier output, earlier PR252 reviewers/workers, and prior accepted workers. It uses
`gpt-5.6-sol`, `xhigh`, `serviceTier: "default"`, and a request with no `fastMode` field.

The reviewer has no write, repair, refill, re-resolution, stage, merge, commit, or push authority. It
reruns every check and scan and returns explicit `ACCEPT` or `REJECT`. Only `ACCEPT` with P0/P1/P2
`0/0/0` permits broker integration.

## Reviewed ordered integration

Immediately before integration, the broker reruns the exact `git ls-remote` command above and
requires the pinned source `3b48f939...`. With a fresh independent `ACCEPT` and unchanged source,
the broker creates only a true merge with ordered parents:

```text
[storedRouterCommit, 3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95]
```

It proves the exact five conflicts, materializes pinned-source non-conflicts, applies only the
accepted five-path output, reruns all producer/reviewer gates and scans on the final shape, runs the
inherited final source-only command-identity test, creates a conventional merge commit, and pushes.

A one-parent, squash, patch-only, reversed-parent, moving-source, extra-conflict, clean-rewrite,
rejected-output replay, whole-blob-copy, non-default-tier, provenance-field, task-store-weakening, or
gate-failing result is rejected and not pushed.

## Stop and HOLD

Stop on router authority, job/task/workspace, base/`HEAD`, patch, index, untracked path, scope, source,
conflict-set, continuation request, duplicate activity, model/effort/tier, controller, matcher,
semantic, test count/result, native diagnostic, scan, independence, review, or integration drift.
P1.R2, P1.I, P1.F, and Phase 2+ remain blocked until the validated ordered merge is pushed.

This router launches nothing and performs no fetch, stage, commit, merge, push, lifecycle action, or
real-project access. End `HOLD`.
