# Phase 1: contracts and conformance

Status: **one serial P1.1D producer after the router-policy-integration and
successor-controller-live gate**. P1.R2 and every later node remain blocked.

## Accepted predecessors and provenance

P1.S0 is accepted at `6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`; P1.S1 is accepted and
integrated at `041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`. P1.S2 routes and conformance are
accepted and policy-integrated at `6a9e9ab714359638fb93a6880855a53c9e8ef4be`.

Formal reviewer `agent-teams-hosted-web-refactor-p1-r1-review-v16-r1` returned `ACCEPT` for P1.R1.
The review evidence is policy-integrated at canonical commit
`759a5d4f45c2142485a0acc13760f3de4d0ff6ea` and records routes 16/16, conformance 13/13, and zero P0,
P1, and P2 findings. That commit is the immutable P1.1D base.

## Current route

The route contains exactly these executable packets:

1. [`controller-packet.md`](controller-packet.md)
2. [`lanes/p1-1d-team-lifecycle-read.md`](lanes/p1-1d-team-lifecycle-read.md)

There is one producer slot and no parallel, review, repair, integration, retry, refill, or successor
slot. The producer owns only the packet's exact five product paths, three test paths, and one handoff
path. Those three ownership sets are mutually disjoint; every other path is read-only.

## Launch and capacity

This seven-path docs-only transition does not launch workers or controllers. No producer may start
until the router commit containing these exact packets is policy-integrated after canonical P1.R1 and
a successor controller reports exactly `live=true`. The runtime must bind the integrated router
commit as both `planBundleCommit` and `phaseStartSha`,
`759a5d4f45c2142485a0acc13760f3de4d0ff6ea` as `baseSha`, and the one current P1.1D packet at revision
`phase-01-p1-1d-team-lifecycle-read-r1`.

Before that gate, capacity is zero. After it, capacity is exactly one serial P1.1D producer. A stale
base, wrong packet revision, second worker, extra writable path, or controller value other than
`live=true` fails closed.

## P1.1D boundary

P1.1D defines one feature-owned read/list contract, runtime parser, transport-neutral application
port/use case, narrow public entrypoints, and focused tests. It proves deterministic semantic outcomes
against the accepted synthetic corpus and supplies the remaining positive neighbors for
`P1.NEG.LEGACY_GOD_DTO`, `P1.NEG.NO_FILESYSTEM_ADAPTER_PHASE1`, and
`P1.NEG.SEMANTIC_OUTCOME`.

The node does not add or edit IPC, HTTP, preload, renderer, route-catalog, filesystem, composition,
infrastructure, package/config, fixture, or research paths. It does not mount production behavior,
run a real runtime/project, or create a fake browser implementation. Electron, renderer, transport,
and filesystem responsibilities remain outside the contracts and core application layers.

## Review and successor boundary

The producer writes the single structured handoff `.codex-handoff/phase-01-p1-1d.json` and returns it
for a later review decision. Producer completion does not integrate its changes and does not start
later work. P1.R2, integration/P1.I, P1.F, and Phase 2+ remain blocked until a later reviewed router
separately advances authority.

The authoritative current dependency and ownership projection is
[`execution-dag.md`](execution-dag.md).
