# Phase 1: contracts and conformance

Status: **one formal P1.R1 review lane after the router-integration and successor-controller-live
gate**. P1.1D and every later node remain blocked.

## Accepted predecessors and provenance

P1.S0 is accepted at `6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`; its six bootstrap evidence
paths and historical `phaseStartSha` remain immutable. P1.S1 is accepted and integrated at
`041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`.

P1.S2 began from accepted router `a0dc964e9a71b782b1bbad4769db62a691e50c97`. Routes commit
`74038b54eee23e93798b3aa5d11411d3f7e9adcf` and conformance commit
`6a9e9ab714359638fb93a6880855a53c9e8ef4be` are independently accepted and
policy-integrated/pushed. Independent admission reviewer
`agent-teams-hosted-web-refactor-p1-s2-admission-review-v15-r2` accepted combined input
`02a6b3ac5ac2baaad55c413f8547252dddee4d41`. The admitted input and canonical P1.S2 share tree
`22020029327465ed389cd4479db340082ae81601`; the admission result therefore applies to the exact
canonical bytes while remaining distinct from formal P1.R1 review.

## Current route

The route contains exactly these packets:

1. [`controller-packet.md`](controller-packet.md)
2. [`lanes/p1-r1-review.md`](lanes/p1-r1-review.md)

There is one reviewer slot and no producer, repair, integration, retry, refill, or successor slot. The
reviewer is identity-independent from both producers and the admission reviewer. It owns only
`docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`; every other path is read-only.

## Launch and capacity

This seven-path docs-only transition does not launch workers or controllers. No reviewer may start
until the router commit containing these exact packets is integrated after canonical P1.S2 and a
successor controller reports `live=true`. The runtime must bind the integrated router commit as both
`planBundleCommit` and `phaseStartSha`, `6a9e9ab714359638fb93a6880855a53c9e8ef4be` as `baseSha`, and
the one current review packet.

Before that gate, capacity is zero. After it, capacity is exactly one formal P1.R1 reviewer. A stale
base, wrong packet revision, non-independent identity, second worker, or controller value other than
`live=true` fails closed.

## Review and successor boundary

The reviewer independently evaluates the exact 37-path canonical P1.S2 input, the four evidence IDs,
handoff consistency, boundaries, positive tests, deliberate negatives, and inherited diagnostics. It
runs the packet's exact architecture, scope, negative, focused, lint, Prettier, diff, typecheck, and
secret/path gates and writes one `ACCEPT` or `REJECT` result without modifying an input.

Neither disposition starts later work. P1.1D, P1.R2, integration/P1.I, P1.F, and Phase 2+ remain
blocked until formal P1.R1 `ACCEPT` is integrated and a later docs-only router independently advances
authority.

The authoritative current dependency and ownership projection is
[`execution-dag.md`](execution-dag.md).
