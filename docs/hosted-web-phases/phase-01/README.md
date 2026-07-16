# Hosted Web Phase 1 navigation record

Phase 1 is complete. This directory retains the PR #252 routing paths because they are the established
navigation boundary for base-sync control; it does not reopen a Phase 1 product node.

Current packet authority is `pr252-latest-base-sync-router-v1`. The Phase 2 product wave at
`eee2389f7ee9300df93ef02d92e9ae114949aff4` is accepted and integrated. Only latest-base sync blocks
the Phase 2 milestone and the next phase.

## Supersession

The current route supersedes:

- every packet-authored or branch-authored PR #252 base/source pin;
- every old same-job continuation, dirty-worktree reuse, or fixed conflict-path contract;
- the earlier Phase 2 candidate/product-blocked language as current launch authority; and
- every route that needed a new docs revision merely because the live PR base moved.

No currently observed base SHA is recorded as durable authority. The accepted Phase 2 product SHA is
stable source authority; the base is per-attempt runtime authority.

## Current route

Read the detailed [controller packet](controller-packet.md), [execution DAG](execution-dag.md), and
[latest-base conflict lane](lanes/pr252-base-conflict-resolution.md).

At atomic prepare/start, `ProjectScopedControl` resolves the live PR #252 base exactly once and
records it as a full 40-hex `resolvedBaseSha` in
`pr252.latest-base-binding/v1`. The runtime materializes the product attempt from canonical
`eee2389f7ee9300df93ef02d92e9ae114949aff4`, records the actual conflict paths, and binds the same
base as the ordered second parent. Symbolic names, abbreviated SHAs, observed prior bases, and
re-resolution within an attempt are forbidden.

One product producer may resolve only those actual conflicts. It preserves both parent behaviors,
runs all focused and mechanical checks, self-reviews, and returns `HOLD`. The controller directly
reruns mechanical gates. One fresh independent integration/architecture/security semantic reviewer
then returns `ACCEPT` or `REJECT`; there is no separate mechanical reviewer.

On `ACCEPT` with P0/P1/P2 `0/0/0`, the broker alone may build the exact reviewed tree as a true
merge ordered
`[eee2389f7ee9300df93ef02d92e9ae114949aff4, resolvedBaseSha]`, promote and push it, and prove
GitHub sees the exact head/base pair as non-conflicting. A later base mismatch invalidates only the
attempt and never this stable packet.

## Control boundary

Git commit SHA is primary provenance. Do not add repository handoff manifests or hash-of-manifest
bookkeeping. The runtime owns execution primitives only; the controller owns the entire DAG and every
authorization decision.

No real project, team launch/provisioning, product terminal/smoke, provider/auth, raw lifecycle,
other-repository, broad-docs, or Fast activity is authorized. This router launches no worker or
successor and ends `HOLD`.
