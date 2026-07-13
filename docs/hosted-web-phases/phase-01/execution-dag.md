# Phase 1 execution DAG and ownership

Status: P1.S0, P1.S1, P1.S2, and P1.R1 are accepted and integrated. P1.1D is the sole current serial
product node after its router-policy-integration and live-controller gate. Later nodes are blocked.

## Current DAG

```text
P1.S0 accepted
  -> P1.S1 / P1.1A accepted + integrated at 041b5c7c2
       -> P1.S2 / P1.1B routes accepted at 74038b54e ------+
       -> P1.S2 / P1.1C conformance accepted at 6a9e9ab71 -+
                                                             -> P1.R1 ACCEPT at 759a5d4f4
                                                                  -> P1.1D read/list proof (current)
                                                                       -X-> P1.R2
                                                                             -> P1.I
                                                                               -> P1.F
                                                                                 -> Phase 2+
```

P1.R1 reviewer `agent-teams-hosted-web-refactor-p1-r1-review-v16-r1` recorded routes 16/16,
conformance 13/13, and zero P0/P1/P2 findings. Its accepted evidence is integrated at
`759a5d4f45c2142485a0acc13760f3de4d0ff6ea`. `-X->` remains blocked after the P1.1D producer returns;
a later review and router must separately advance authority.

## Current lane registry

| Node    | Mission                                                          | Dependency                 | Evidence IDs                                                                                                      | Packet                               |
| ------- | ---------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `P1.1D` | Prove one transport-neutral team-lifecycle read/list application | accepted P1.R1 `759a5d4f4` | `P1.1D.TEAM_LIFECYCLE_READ_CONTRACT`, `P1.1D.TEAM_LIFECYCLE_READ_USE_CASE`, `P1.1D.TEAM_LIFECYCLE_SEMANTIC_PROOF` | `lanes/p1-1d-team-lifecycle-read.md` |

Capacity is zero until the exact seven-path router commit is policy-integrated and its successor
controller reports `live=true`. Afterward it is exactly one serial producer. There is no second
producer, review, retry, refill, repair, integration, or later-node capacity.

## Exact exclusive writer set

P1.1D product paths:

- `src/features/team-lifecycle/contracts/team-lifecycle-read.ts`
- `src/features/team-lifecycle/contracts/index.ts`
- `src/features/team-lifecycle/core/application/ListTeamLifecycle.ts`
- `src/features/team-lifecycle/core/application/index.ts`
- `src/features/team-lifecycle/index.ts`

P1.1D test paths:

- `test/features/team-lifecycle/core/ListTeamLifecycle.test.ts`
- `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts`
- `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts`

P1.1D handoff path:

- `.codex-handoff/phase-01-p1-1d.json`

These five-product, three-test, and one-handoff sets are exact and mutually disjoint. Every other path
is read-only. In particular, accepted shared contracts, RouteCatalog/capability sources, conformance
tools, fixture corpus, IPC/HTTP/preload/renderer code, filesystem and production composition,
package/config files, existing handoffs, router docs, and research evidence cannot be edited.

## Boundary and blocked successor

The product paths contain only browser-safe contracts, runtime value parsing, a pure application port
and use case, and narrow public entrypoints. Test-owned in-memory values may drive the port; no product
test double, fake browser, filesystem adapter, transport adapter, production mount, or real runtime is
part of this node.

The producer returns one exact handoff with the three evidence IDs, all checks, the complete focused
negative matrix, path hashes, unverified claims, and next action `review`. P1.R2, P1.I, P1.F, and Phase
2+ remain blocked. Neither producer success nor handoff creation authorizes integration, commit, push,
successor launch, or scope expansion.
