# Hosted-web execution packets

Current authority is the stable [PR #252 latest-base sync gate](phase-01/controller-packet.md),
revision `pr252-latest-base-sync-router-v2-proposal`. Start with [START_HERE.md](START_HERE.md) and treat
[EXECUTION_INDEX.json](EXECUTION_INDEX.json) as the machine-readable source of truth.

The Phase 2 product wave at
`eee2389f7ee9300df93ef02d92e9ae114949aff4` is accepted and integrated. The Phase 2 milestone and
the next phase are blocked only by the PR #252 latest-base sync gate. The files under
`phase-02/` remain read-only accepted product inputs; their earlier candidate/product-launch wording
is superseded and is not current execution authority. The canonical PR head and
materialization source are the live PR #252 branch head, resolved exactly once at each atomic
product-attempt prepare/start (authoring-time head: `ec43eb727b5a90dbbd16bdd74b72397000abcd82`);
the accepted product-wave commit is its historical ancestor. Accepted commits landing on the
branch after this document supersede the authoring-time SHA without a new router revision.

## Stable latest-base rule

No observed PR base SHA is a durable packet pin. At each atomic product-attempt prepare/start,
`ProjectScopedControl` resolves the live PR #252 base exactly once and records the full 40-hex commit
in the immutable `pr252.latest-base-binding/v1` product-worker pre-start contract. In the same transition it
resolves the live PR head once, materializes from it, mechanically merges the bound base, records
the exact actual conflict paths, and binds that head and base as the ordered first and second
parents.

Later base drift invalidates only the bound product attempt. Once that attempt is terminal, the
controller may prepare one replacement under the same packet and format. Drift never revives an old
source pin, reuses a dirty worker, or requires another docs/router version.

## Bounded route

The controller DAG permits one active product merge-resolution producer, writable only on the actual
conflict paths. The producer preserves both the accepted Phase 2 wave behavior and the bound latest-base
behavior, runs focused tests and every mechanical gate, self-reviews, and ends `HOLD`.
`ProjectScopedControl` directly reruns the mechanical gates; there is no separate mechanical
reviewer. One fresh independent reviewer then makes the combined integration, architecture, security,
and semantic decision.

Only an independent `ACCEPT` with P0/P1/P2 `0/0/0` lets the broker create the reviewed tree as a
true two-parent merge ordered `[attempt.canonicalHeadSha, attempt.resolvedBaseSha]`, promote and
push it with the attempt-bound canonical head as the expected old PR head, and prove the exact
pushed head/base pair is non-conflicting on GitHub. Git commit SHAs are primary provenance.
Repository handoff manifests and hash-of-manifest bookkeeping are forbidden.

## Ownership and stop boundary

The subscription runtime owns execution primitives only. `ProjectScopedControl` owns the DAG,
dependencies, admissions, mechanical-gate decisions, drift invalidation, semantic review policy,
promotion authorization, and phase release.

No route here authorizes real-project access, team launch/provisioning, product terminal or smoke
flows, providers/auth, raw lifecycle calls, other repositories, broad docs work, or Fast mode. Every
actor ends `HOLD`; this router author launches no successor.
