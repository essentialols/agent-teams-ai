# Phase 1 execution DAG and ownership

Status: P1.S0, P1.S1, P1.S2, P1.R1, and P1.1D are accepted and integrated. P1.1D's pushed commit
`e7e7e734c82c49105682e7a19bbedafa1f5ddbad` is historical provenance only. The sole current edge is
the PR #252 semantic five-path remediation router r2. End `HOLD`.

## Current DAG

```text
P1.S0 accepted
  -> P1.S1 accepted + integrated
       -> P1.S2 routes + conformance accepted
            -> P1.R1 ACCEPT
                 -> P1.1D remediation
                      -> independent FORMAL ACCEPT P0/P1/P2=0
                           -> accepted P1.1D integration pushed
                                -> byte-copy producer + reviewer REJECT (terminal; never reuse)
                                     -> semantic router r1 REJECT (invalid launch contract; consumed)
                                          -> semantic router r2 docs review
                                               -> router ACCEPT + integration + push
                                                    -> resolve accepted pushed router SHA once
                                                         -> render one fully concrete producer request
                                                              -> semantic five-path producer
                                                                   -> self-review + immutable output + HOLD
                                                                        -> prepare fresh independent no-write verifier
                                                                             -> strict reviewKind=review
                                                                             -> ACCEPT only at P0/P1/P2=0/0/0
                                                                                  -> ProjectScopedControl true merge
                                                                                       -> source non-conflicts materialized
                                                                                            -> all gates + command-identity test
                                                                                                 -> conventional commit + push
                                                                                                      -X-> P1.R2 -> P1.I -> P1.F -> Phase 2+
```

The runtime does not select or alter this DAG. It validates stored identities and fails closed on
drift. Neither a rejected job nor a moving ref supplies execution authority.

## Provenance and fixed identities

| Record                          | Identity                                                                                    | Disposition / use                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Fixed router base               | `7c502f45df32b58bbc161b26dcc28df8a17107c9`                                                  | immutable `baseSha`                                          |
| Byte-copy implementation patch  | `a0fade213fd86c52022f944c9d3a9f169175f1fd5a54f6c19652173ae5307304`                          | producer/reviewer `REJECT`; provenance only                  |
| Semantic router r1 patch        | `95dcdae236fdadbd63bfb3022441accc4354cffdc5ca6db7447e7a01e9d53221`                          | `REJECT`; invalid future launch contract                     |
| Router r1 rejection consumption | `pr252-semantic-router-r1-contract-reject-consume-v1`                                       | terminal decision record                                     |
| Current packet revision         | `phase-01-pr252-semantic-conflict-remediation-router-r2`                                    | sole correction authority                                    |
| Merge source                    | `origin/refactor/team-provisioning-round2-reapply@7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0` | immutable source metadata outside the strict worker contract |

No rejected patch is an implementation input. The clean producer attempt has
`inputPatchHash=null`, `revision=0`, `retryCount=0`, and `supersedes=null`.

## Post-push target edge

Product-worker capacity is zero until r2 receives independent `ACCEPT`, is integrated, and is
pushed. `ProjectScopedControl` then resolves that accepted pushed router commit once and stores the
full SHA. It binds the stored SHA to:

- producer `canonicalSha` and `phaseStartSha`;
- outer `sourceRef` and `baseBranch` plan metadata;
- producer worktree `HEAD` materialization metadata;
- reviewer target and materialization;
- `mark_reviewed` and integration target; and
- the true merge's first parent.

`baseSha` stays `7c502f45df32b58bbc161b26dcc28df8a17107c9`. The merge source stays the pinned
`7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0` commit. Any second resolution, placeholder, unequal
binding, moving ref, or canonical drift stops the DAG.

The concrete producer/reviewer contract check list is seven exact `{id,cwd,command}` objects with
`cwd="src"` and `cd .. && ` command prefixes, never the human prose gate list. Its execution policy
has exactly `mode`, the fully concrete isolated `sandboxRoot`, and a fixed nonempty
`forbiddenRealProjects` list. Extended orchestration safety flags remain outside the strict contract;
string checks, extra policy keys, and unresolved binding/copy objects stop the DAG.

## Current lane registry

| Node                                  | Mission                                           | Capacity                                    | Packet / revision                                                                                    |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `PR252-semantic-conflict-remediation` | Semantically reconcile exactly five PR #252 paths | one producer, then one independent reviewer | `lanes/pr252-base-conflict-resolution.md` / `phase-01-pr252-semantic-conflict-remediation-router-r2` |

Both workers use `xhigh` reasoning and the `default` service tier with Fast forbidden. The producer
owns only the five paths below. The reviewer owns no repository path. Neither worker may stage,
merge, commit, or push.

## Exact semantic scope

1. `src/features/task-board-commands/core/application/TaskBoardCommandFacade.ts`
2. `src/main/services/team/TeamDataService.ts`
3. `src/renderer/components/team/TeamDetailView.tsx`
4. `test/features/task-board-commands/TaskBoardCommands.e2e.test.ts`
5. `test/main/services/team/TeamDataService.test.ts`

The producer must combine target and source intent within these paths, not copy complete source
blobs. Facade destination `reconcile` is optional and capability-driven; absent capability falls back
to `findById` plus validation, present mismatched provenance is terminal, and an unknown outcome
cannot become success. `TeamDataService` narrowly guards `reconcileTaskCreation`, omits the port when
absent, keeps `projectPath` outside the hashed payload, and sorts/dedupes relations.

`TeamDetailView` provides a dual-signature async adapter for the target positional and source
request-object Promise callbacks, retaining stable positional command identity and preserving
`request.command`. The TaskBoard E2E file keeps the four target cases and ports the five source cases
for exactly nine without unguarded real-controller reconcile. The supported final task-board API
keeps the coherent `reconcileTaskCreation` path; a narrow target-mock or older-boundary guard does
not authorize its omission when the capability exists. No sixth producer path may change.

## Review and integration edges

The producer must prove an empty index, run both focused suites, classify exactly the inherited seven
Phase 0 typecheck diagnostics, run exact five-file `lint:fast:files` and Prettier, and pass diff,
ownership, conflict-marker, secret/private-path, and binary scans. It self-reviews, emits one
immutable output, and ends `HOLD`.

`ProjectScopedControl` invokes `codex_goal_project_prepare_verifier` exactly once for the fresh
independent reviewer. It uses `workerRole: reviewer`, strict runtime `reviewKind: review`, and the
no-write policy; architecture/integration remains purpose prose. The concrete request fails closed
on drift, and the reviewer reruns the same gates without writes. `ACCEPT` requires P0/P1/P2 `0/0/0`;
every other result blocks. Only after acceptance may `ProjectScopedControl` bind the reviewed output
to the stored target and pinned source, create the true ordered two-parent merge
`[stored accepted router target, 7afc908ce92f14b4b0ebd06cc4aa3a4cf33807d0]`, materialize the
pinned source's non-conflict paths, apply the reviewed output to the five conflicts, rerun all gates
on that final shape, and also run
`pnpm exec vitest run test/renderer/utils/createTaskCommandIdentity.test.ts`, make a conventional
commit, and push.

P1.R2, P1.I, P1.F, and Phase 2+ remain blocked until that push. This docs author launches no job and
performs no fetch, stage, commit, merge, push, or integration attempt. Terminal state: `HOLD`.
