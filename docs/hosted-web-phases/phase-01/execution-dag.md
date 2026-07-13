# Phase 1 execution DAG and ownership

Status: P1.S0, P1.S1, P1.S2, and P1.R1 are accepted and integrated. The original P1.1D r3 candidate
is independently rejected and preserved. `P1.1D-additive-response-remediation` is the sole current
serial node after its router-policy-integration and live-controller gate. Later nodes are blocked.

## Current DAG

```text
P1.S0 accepted
  -> P1.S1 / P1.1A accepted + integrated at 041b5c7c2
       -> P1.S2 / P1.1B routes accepted at 74038b54e ------+
       -> P1.S2 / P1.1C conformance accepted at 6a9e9ab71 -+
                                                             -> P1.R1 ACCEPT at 759a5d4f4
                                                                  -> original P1.1D router at 1b37afb02
                                                                       -> r3 candidate REJECT
                                                                            -> additive-response remediation (current)
                                                                                 -> independent ACCEPT required
                                                                                      -X-> P1.R2
                                                                                            -> P1.I
                                                                                              -> P1.F
                                                                                                -> Phase 2+
```

The rejected r3 patch
`a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee` remains immutable,
unintegrated evidence. The current producer creates a fresh candidate; it does not repair or relabel
that artifact. `-X->` remains blocked after remediation production, independent review, and any
separately authorized remediation integration. A later router must advance authority.

## Current lane registry

| Node                                  | Mission                                                                                               | Dependency                   | Evidence IDs                                                                                                      | Packet                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `P1.1D-additive-response-remediation` | Preserve strict requests; project and discard additive fields from every same-version response object | canonical router `1b37afb02` | `P1.1D.TEAM_LIFECYCLE_READ_CONTRACT`, `P1.1D.TEAM_LIFECYCLE_READ_USE_CASE`, `P1.1D.TEAM_LIFECYCLE_SEMANTIC_PROOF` | `lanes/p1-1d-additive-response-remediation.md` |

Capacity is zero until the exact seven-path router is policy-integrated and its successor controller
reports `live=true`. Afterward capacity is exactly one serial, one-shot producer. There is no second
producer, retry, refill, integration, P1.R2, or later-node capacity.

## Exact exclusive writer set

Product paths:

- `src/features/team-lifecycle/contracts/team-lifecycle-read.ts`
- `src/features/team-lifecycle/contracts/index.ts`
- `src/features/team-lifecycle/core/application/ListTeamLifecycle.ts`
- `src/features/team-lifecycle/core/application/index.ts`
- `src/features/team-lifecycle/index.ts`

Test paths:

- `test/features/team-lifecycle/core/ListTeamLifecycle.test.ts`
- `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-contract.test.ts`
- `test/architecture/hosted-web/phase-1/team-lifecycle/team-lifecycle-read-boundaries.test.ts`

Handoff path:

- `.codex-handoff/phase-01-p1-1d.json`

These five-product, three-test, and one-handoff sets are exact and mutually disjoint. Every other path
is read-only. The rejected r3 workspace, patch, handoff, hashes, and review record are external
immutable inputs and are never modified in place.

## Gates and blocked successor

The candidate must preserve every original P1.1D semantic, negative-neighbor, architecture, focused
test, ratchet, lint, typecheck-classification, formatting, provenance, ownership, hash, and safety
gate. Additive-response positives must cover success, failure, and inapplicable top-level objects and
nested list-item and safe-error objects; strict request negatives must cover top-level and nested
context own fields. Every returned value is a fresh known-field projection.

The regenerated handoff returns only for independent review. `ACCEPT` must come from a distinct
reviewer that reruns the exact gates and validates the new hashes. P1.R2, P1.I, P1.F, and Phase 2+
remain blocked. No producer or reviewer success authorizes integration, commit, push, launch, or scope
expansion.
