# Phase 1: contracts and conformance

Status: **P1.1D accepted, integrated, and pushed; PR #252 semantic conflict router r2 is the sole
current correction; HOLD**.

## Accepted historical provenance

P1.S0, P1.S1, P1.S2, and formal P1.R1 remain accepted and integrated. P1.1D has independent
`FORMAL ACCEPT` with P0/P1/P2 `0/0/0` from
`agent-teams-hosted-web-refactor-p1-1d-shadowed-map-review-v17-r4`.

- Strict result SHA-256:
  `be0c9abd679f817c386d1d06d1b738c2a1505bb3c4718279129ab74842c98fa6`
- Reviewed output ID: `f3394026185348c84673d44a9b30a82667c3ff9435b5d4d7609c04785c274f41`
- Accepted integration: `p1-1d-shadowed-map-r4-accepted-integration-v3`
- Accepted/pushed P1.1D commit: `e7e7e734c82c49105682e7a19bbedafa1f5ddbad`

Those values are immutable historical provenance, not authority to rerun P1.1D or a target/base for
the current route.

## Rejected PR #252 lineage

The prior semantic router r1 patch
`95dcdae236fdadbd63bfb3022441accc4354cffdc5ca6db7447e7a01e9d53221` has disposition `REJECT`
because its future launch contract was invalid. The consumption record is
`pr252-semantic-router-r1-contract-reject-consume-v1`. Revision
`phase-01-pr252-semantic-conflict-remediation-router-r2` supersedes its authority without reusing any
r1 job state or bytes.

The earlier whole-source-blob producer patch
`a0fade213fd86c52022f944c9d3a9f169175f1fd5a54f6c19652173ae5307304` and independent reviewer
also remain `REJECT`. Neither rejected producer nor reviewer may be integrated, reused, retried, or
continued.

## Current route

The route contains exactly these executable packets:

1. [`controller-packet.md`](controller-packet.md)
2. [`lanes/pr252-base-conflict-resolution.md`](lanes/pr252-base-conflict-resolution.md)

The sole node is `PR252-semantic-conflict-remediation`; fixed `baseSha` is
`7c502f45df32b58bbc161b26dcc28df8a17107c9`. Product-worker capacity is zero until the seven-path r2
router is accepted, integrated, and pushed.

After push, `ProjectScopedControl` resolves the accepted pushed router commit exactly once and stores
its full SHA. That same immutable target supplies `canonicalSha`, `phaseStartSha`, `sourceRef`,
`baseBranch`, producer worktree `HEAD`, reviewer and review bindings, integration target, and the
true merge's first parent. A placeholder, second resolution, or drift fails closed.

The merge source remains
`origin/refactor/team-provisioning-round2-reapply@7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0` and stays
outside the strict contract with all plan/materialization metadata. The clean implementation has
`inputPatchHash=null`, `revision=0`, `retryCount=0`, and `supersedes=null`.

The strict contract copies its checks from the seven exact `{id,cwd,command}` references, not the
human prose gate list. Every check uses `cwd="src"` and a `cd .. && ` command prefix. Its strict
execution policy contains only `mode`, a fully concrete isolated `sandboxRoot`, and a fixed nonempty
`forbiddenRealProjects` list; extended safety flags remain outer orchestration controls. Rendering
fails on a string check, extra policy key, or unresolved binding/copy directive.

## Semantic resolution and review boundary

Exactly one serial `xhigh`/`default` producer, with Fast forbidden, owns the five paths in the lane
packet. It resolves conflicts semantically and never byte-copies an entire source blob. It preserves
the target task-board API with an optional facade `reconcile` destination capability: use the
capability when present and otherwise use `findById` plus validation. Present mismatched provenance
is terminal and unknown never becomes success. `TeamDataService` uses a narrow runtime guard for
`reconcileTaskCreation`, omits the port when absent, keeps `projectPath` out of the hashed payload,
and sorts/dedupes relations.

The producer also implements a dual-signature async `TeamDetailView` adapter for both the current
positional dialog and the source request-object Promise API, preserving stable positional command
identity and `request.command`. It retains four target TaskBoard E2E cases and ports five source
cases for exactly nine without unguarded real-controller reconcile. The final supported task-board
API retains the coherent `reconcileTaskCreation` path; narrow target-mock or older-boundary guards do
not authorize omitting it when present. The producer runs all checks, self-reviews, returns one
immutable output, and ends `HOLD` without Git mutation or reviewer launch.

Then `ProjectScopedControl` invokes `codex_goal_project_prepare_verifier` exactly once for one fresh
independent `xhigh`/`default` reviewer, with Fast forbidden and no writer authority. The verifier
uses `workerRole: reviewer` and strict runtime `reviewKind: review`; architecture/integration is its
purpose only. Its fully concrete request fails closed on missing, extra, placeholder, binding, or
drifting values. The reviewer reruns every gate. Only explicit `ACCEPT` with P0/P1/P2 `0/0/0`
permits `ProjectScopedControl` integration.

The integration creates the true merge with ordered parents `[stored accepted router target,
7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0]`, verifies the semantic output and full gate set, makes
a conventional commit, and pushes it. After non-conflict source materialization, its gate set also
runs `pnpm exec vitest run test/renderer/utils/createTaskCommandIdentity.test.ts`. P1.R2, P1.I,
P1.F, and Phase 2+ remain blocked until that push.

The authoritative dependency and ownership projection is [`execution-dag.md`](execution-dag.md).
This docs router changes only its exact seven owned docs paths, launches nothing, performs no fetch,
stage, commit, merge, push, or integration attempt, and ends `HOLD`.
