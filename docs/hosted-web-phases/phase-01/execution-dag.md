# Phase 1 execution DAG and ownership

Status: current revision is `phase-01-p1-r2-router-r1`; end `HOLD`.

## Current DAG

```text
accepted P1.1D lineage -> c3135d40...
accepted PR #252 source -> 3b48f939...
                          |
                          v
accepted product true merge 66604203...
ordered parents [c3135d40..., 3b48f939...]
PR #252 conflict gate ACCEPTED + P1.1D ACCEPTED
                          |
                          v
unchanged exact 32 product inputs -> reviewedProductSnapshotSha 66604203...
                          |
                          v
seven-path P1.R2 router authored at packetBaseSha 48d79e2b...
                          |
                          v
router review -> policy integration + push
                          |
                          v
broker returns + pushes exact postIntegrationAuthoritySha (unknown before integration)
                          |
                          v
root resolves/immutably attests postIntegrationAuthoritySha
clean + explicit origin refs/heads/refactor/hosted-web-feature-boundaries equality
                          |
                          v
root uses codex_goal_project_refill_worker for exactly one clean independent reviewer
reviewKind=review + inputPatchHash=null; prepare_verifier forbidden
expectedSourceCommit/worktree HEAD = postIntegrationAuthoritySha
contract canonical/base/start = postIntegrationAuthoritySha
handoff base/canonical/plan-bundle/start/head = postIntegrationAuthoritySha
handoff reviewedProductSnapshotSha = 66604203...
broker has materialized dependencies offline; reviewer installs nothing
                          |
                          v
focused contracts + team-lifecycle command
                          |
                          v
semantic/auth/error/cursor/kernel-size review
                          |
                          v
typecheck baseline + Prettier/diff + two-path scope + classified scans
                          |
                          v
explicit ACCEPT or REJECT with P0/P1/P2 counts
                          |
                          v
strict terminal result + broker-captured immutable output required
immutable output binds bytes/hashes of both exact result paths
                          |
              +-----------+--------------------+
              |                                |
              v                                v
semantic/content/gate finding              ACCEPT 0/0/0
       -> REJECT -> HOLD                       |
                                               v
                              root mechanically verifies
                                      -> mark_reviewed
                                               |
                                               v
                              broker integrates + pushes exactly
                              the handoff and Markdown evidence
                                               |
                                               v
                                              HOLD
                                               |
                                               -X-> later docs router may authorize P1.I
                                                    without reintegrating P1.R2 evidence
                                                    -> P1.F -> Phase 2+ / product workers

missing/invalid authority attestation, checkout, remote-query/network,
admission/provider/environment/no-strict-result runtime incident -> HOLD
                          |
                          `-> at most one exact corrected attempt, only after
                              terminal/no-runner proof and never concurrently
```

Root is the sole orchestrator. `controller-v17` remains `HOLD` and observation-only. Controller
launch, admission, integration, restart, replacement, and successor creation are not DAG edges. This
docs router launches no edge.

## Proven identities

| Record                     | Identity                                                            | Authority                                               |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Router `packetBaseSha`     | `48d79e2b13e258fc82ad55723875f15d6e162872`                          | authoring base only; never future review authority      |
| Post-integration authority | `postIntegrationAuthoritySha`                                       | broker-returned pushed commit; intentionally unresolved |
| Authority remote ref       | `origin refs/heads/refactor/hosted-web-feature-boundaries`          | root immutable `git ls-remote` attestation              |
| Reviewed product snapshot  | `666042037a9c91df572b1d8274bf6024f8d00f40`                          | exact 32 unchanged product inputs                       |
| Ordered first parent       | `c3135d40c6e70e4b2ddc905dc815407397197634`                          | accepted P1.1D-side lineage                             |
| Ordered second parent      | `3b48f9391b4bff1d82bc85ef01a2d5e0e5b50e95`                          | accepted PR #252 merge source                           |
| Merge shape                | exact true two-parent merge                                         | accepted product-snapshot topology                      |
| PR #252 conflict gate      | complete and accepted                                               | immutable predecessor                                   |
| P1.1D                      | complete and accepted                                               | immutable predecessor                                   |
| Historical PR #252 lane    | `phase-01/lanes/pr252-base-conflict-resolution.md`, SHA-256 `f55c…` | unchanged provenance; non-executable                    |
| Current evidence           | `P1.R2.SEMANTIC_REVIEW`                                             | pending one independent formal review                   |

## Current capacity and ownership

Capacity is exactly one fresh independent reviewer using `gpt-5.6-sol`, `xhigh`, and
`serviceTier: "default"`. Fast is not authorized. Dependencies are broker-materialized offline and
the reviewer must not install them. The reviewer writes exactly:

1. `.codex-handoff/phase-01-p1-r2.json`
2. `docs/research/hosted-web/phase-1/reviews/list-semantics.md`

Every reviewed product, test, fixture, prior handoff, router, research, configuration, package,
lockfile, runtime, and historical packet is read-only. A third output, staged path,
reviewed-product-input edit, or product change is not a DAG edge and requires `REJECT`.

## Required review transition

The focused command is exactly:

```bash
pnpm exec vitest run test/architecture/hosted-web/phase-1/contracts test/features/team-lifecycle
```

It must pass 5 files and 14/14 tests. Typecheck must match the current accepted baseline exactly:
seven inherited Phase 0 diagnostics, zero P1.R2-owned diagnostics, and zero unexpected diagnostics.
Prettier, diff, exact two-path ownership, secret/provider/private-path scans,
authority/snapshot/parent provenance, and all semantic review requirements must pass.

Root first resolves `postIntegrationAuthoritySha` from the exact broker-returned pushed commit and
captures immutable pre-start `git ls-remote origin
refs/heads/refactor/hosted-web-feature-boundaries` equality evidence. The reviewer performs no network
query: it validates that attestation, proves local `HEAD` equals its bound `expectedSourceCommit`,
binds all five handoff authority SHA fields to `postIntegrationAuthoritySha`, and proves every one of
the 32 product inputs matches reviewed product snapshot
`666042037a9c91df572b1d8274bf6024f8d00f40` byte-for-byte.

The strict result is exactly `ACCEPT` or `REJECT`, with explicit P0/P1/P2 counts. `ACCEPT` requires
P0/P1/P2 `0/0/0`; there is no conditional acceptance or repair authority. Semantic, content, and
review-gate findings produce `REJECT`. Admission, provider, environment, and no-strict-result
failures are runtime incidents and produce `HOLD` without a synthetic disposition. No concurrent
duplicate is permitted; root may authorize at most one exact corrected attempt after proving the
affected attempt terminal or proving no runner exists.
Missing or invalid immutable authority attestation, checkout failure, and root remote-query/network
failure are admission/environment incidents under this rule, not semantic findings.

Completion requires both the strict terminal result and broker-captured immutable output binding the
bytes and hashes of both exact result paths. `changedFiles`, heartbeat, PID, tmux, and
`providerObserved` cannot satisfy that edge. On strict `ACCEPT` 0/0/0, root mechanically verifies
both proofs, invokes `mark_reviewed`, and the broker integrates and pushes exactly the two evidence
paths. Neither root nor the reviewer performs that Git lifecycle.

P1.I, P1.F, Phase 2+, and every product worker remain blocked after evidence integration. Only a
later separately reviewed docs router may authorize P1.I; it uses the already integrated evidence
and must never integrate either P1.R2 evidence path again. No edge launches a successor controller.
