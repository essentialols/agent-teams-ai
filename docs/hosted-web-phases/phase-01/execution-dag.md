# PR #252 latest-base sync execution DAG

Status: `pr252-latest-base-sync-router-v2-proposal`; terminal state: `HOLD`.

The accepted/integrated Phase 2 product wave is
`eee2389f7ee9300df93ef02d92e9ae114949aff4`. The Phase 2 milestone and next phase are blocked only
by latest-base sync. The authoring-time router/canonical head
`ec43eb727b5a90dbbd16bdd74b72397000abcd82` descends from that historical product wave; the live PR
head is re-resolved once at each atomic attempt prepare/start. No observed base or head is durable
packet authority.

## Ordered DAG

```text
P2 product wave eee2389f... ACCEPTED + INTEGRATED
  -> PR252.ROUTER.ACTIVE (canonical head live-resolved at attempt start)
    -> PR252.BINDING.ATOMIC
       ProjectScopedControl resolves live base exactly once
       writes immutable pr252.latest-base-binding/v1 pre-start contract
       materializes product attempt from attempt.canonicalHeadSha
       records actual conflict paths
       binds [attempt.canonicalHeadSha, resolvedBaseSha]
      -> PR252.SYNC.PRODUCER (capacity 1)
         edit actual conflict paths only
         preserve canonical-wave behavior + bound-base behavior
         focused tests + every mechanical gate + self-review
        -> HOLD
          -> PR252.SYNC.CONTROLLER_MECHANICAL
             controller compares live base and directly reruns all mechanical gates
             no mechanical-review worker
            -> PR252.SYNC.SEMANTIC_REVIEW (exactly 1 fresh independent reviewer)
               combined integration + architecture + security + semantic decision
              -> HOLD
                ACCEPT; P0/P1/P2 = 0/0/0
                  -> PR252.SYNC.BROKER_PROMOTION_PROOF
                     compare live base and canonical PR head again
                     create exact reviewed tree as true ordered two-parent merge
                     parents [attempt.canonicalHeadSha, resolvedBaseSha]
                     promote + push with expected-old-head protection
                     prove remote head and GitHub head OID equal merge commit
                     prove GitHub base OID still equals resolvedBaseSha
                     prove GitHub mergeability resolved and non-conflicting
                    -> PR252.LATEST_BASE_SYNC RELEASED
                      -> Phase 2 milestone/next phase eligible for separate decisions
                      -> HOLD; launch no successor
                REJECT or nonzero finding
                  -> no promotion
                  -> HOLD
```

At any comparison point:

```text
live base != attempt.resolvedBaseSha
  -> invalidate that product attempt and all attempt-bound results
  -> clear capacity only after the attempt is terminal
  -> later ProjectScopedControl may run a new atomic prepare/start
     with the same pr252.latest-base-binding/v1 format and same router revision
  -> no docs edit, source-pin update, same-job continuation, or new router version
```

## Node invariants

### `PR252.BINDING.ATOMIC`

- `ProjectScopedControl` owns the transition and DAG decision.
- Runtime owns only the selected resolve/materialize/record/start primitives.
- The canonical PR head is the live PR #252 head resolved once at prepare/start
  (authoring-time observation: `ec43eb727b5a90dbbd16bdd74b72397000abcd82`).
- Live base is resolved once into an exact full 40-hex `resolvedBaseSha`.
- Product materialization starts from the live-resolved canonical head (`attempt.canonicalHeadSha`).
- The same base is the ordered second parent.
- Actual conflicts and focused commands are frozen before producer start.
- Partial admission, ambiguity, or duplicate capacity starts no worker and ends `HOLD`.

### `PR252.SYNC.PRODUCER`

- One fresh producer; no old job/worktree/patch continuation and no Fast mode.
- Writable scope equals the actual `conflictPaths` set, with no exception.
- Mechanically merged non-conflict bytes are immutable.
- Every resolution preserves both parent behaviors or records a blocker.
- All focused tests and declared mechanical gates run before complete self-review.
- Result is runtime-owned, bound to attempt/tree SHAs, and ends `HOLD`.
- No repository handoff manifest, commit, reviewer launch, or integration.

### `PR252.SYNC.CONTROLLER_MECHANICAL`

- Controller compares live base before evaluation.
- Controller invokes runtime check primitives and directly evaluates fresh results.
- It reruns binding/scope/non-conflict equality, index/marker, focused tests, typecheck, exact-file fast
  lint, exact-file Prettier, diff check, and classified security/private-path gates.
- There is no separate mechanical reviewer.

### `PR252.SYNC.SEMANTIC_REVIEW`

- Exactly one fresh reviewer, independent of router, producer, prior invalidated attempts, and broker.
- Combined integration, architecture, security, and semantic role.
- No write, repair, rebind, retry, commit, merge, push, or successor authority.
- Reviews the exact attempt/base/conflict/tree binding and controller mechanical evidence.
- Only `ACCEPT` with P0/P1/P2 `0/0/0` creates a broker edge.

### `PR252.SYNC.BROKER_PROMOTION_PROOF`

- Base and canonical PR head still match immediately before construction/push.
- Exactly two ordered parents: `[attempt.canonicalHeadSha, resolvedBaseSha]`.
- Commit tree exactly equals the accepted reviewed tree.
- Push uses expected-old-head protection fixed to `attempt.canonicalHeadSha`.
- Remote and GitHub head equal the merge commit; GitHub base equals the bound base.
- GitHub state is resolved and non-conflicting; `UNKNOWN` or `CONFLICTING` is not proof.
- Git commit SHA is primary provenance; no repository manifest/manifest hash.

## Capacity and ownership

At most one product attempt and one producer are active or promotable. Exactly one semantic reviewer
may follow controller mechanical acceptance. The controller, runtime primitives, docs actors, and
broker do not consume product capacity.

The router owns exactly:

1. `docs/hosted-web-phases/EXECUTION_INDEX.json`
2. `docs/hosted-web-phases/README.md`
3. `docs/hosted-web-phases/START_HERE.md`
4. `docs/hosted-web-phases/phase-01/README.md`
5. `docs/hosted-web-phases/phase-01/controller-packet.md`
6. `docs/hosted-web-phases/phase-01/execution-dag.md`
7. `docs/hosted-web-phases/phase-01/lanes/pr252-base-conflict-resolution.md`

No product source, test, Phase 2 packet, research/evidence, runtime, config, dependency, lockfile,
repository-index, or handoff path is writable to the router.

## Terminal boundary

No node uses real projects, team launch/provisioning, product terminal/smoke, provider/auth flows, raw
lifecycle calls, other repositories, broad docs work, or Fast mode. Runtime cannot select, reorder,
retry, or advance the DAG. Every actor ends `HOLD`; this router launches no successor.
