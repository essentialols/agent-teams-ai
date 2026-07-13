# Phase 1: contracts and conformance

Status: **one serial P1.1D additive-response remediation producer after router-policy-integration and
successor-controller-live gates**. P1.R2 and every later node remain blocked.

## Provenance

P1.S0 is accepted at `6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`; P1.S1 is accepted and
integrated at `041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`; P1.S2 is accepted at
`6a9e9ab714359638fb93a6880855a53c9e8ef4be`; and formal P1.R1 is accepted at
`759a5d4f45c2142485a0acc13760f3de4d0ff6ea`. The original P1.1D router is canonical at
`1b37afb02bec25a1f08432d733595b553101ecab`.

P1.1D producer r3 returned the exact nine-path patch
`a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee`. Independent review
formally rejected it with one P1 finding because same-version success, failure, inapplicable, and
nested item response objects rejected additive fields. Requests correctly remained strict. The r3
patch, handoff, hashes, and review disposition are immutable rejected evidence, not integrated work.

## Current route

The route contains exactly these executable packets:

1. [`controller-packet.md`](controller-packet.md)
2. [`lanes/p1-1d-additive-response-remediation.md`](lanes/p1-1d-additive-response-remediation.md)

There is one remediation producer slot and no parallel, retry, refill, integration, P1.R2, or
later-node slot. The producer owns exactly the packet's five product paths, three test paths, and one
handoff path. Every other repository path is read-only.

## Launch and capacity

This seven-path docs-only transition launches no worker or controller. No producer may start until
the router commit containing these packets is policy-integrated after
`1b37afb02bec25a1f08432d733595b553101ecab` and a successor controller reports exactly `live=true`.
The runtime must bind that integrated commit as both `planBundleCommit` and `phaseStartSha`,
`1b37afb02bec25a1f08432d733595b553101ecab` as `baseSha`, and packet revision
`phase-01-p1-1d-additive-response-remediation-r1`.

Before both gates, capacity is zero. Afterward it is exactly one serial remediation producer in a new
isolated worktree. A stale or mixed binding, a controller value other than `live=true`, a second
worker, or prior consumption of this one-shot packet fails closed.

## Remediation boundary

The new candidate may consume the rejected r3 artifact read-only and reproduce its useful narrow
contract, application, entrypoint, and test work. It must preserve the artifact itself unchanged and
must regenerate the handoff and all file/patch hashes.

Requests remain exact and reject additive own string or symbol fields, including in the nested query
context. Same-version responses do the opposite only after all known fields validate: top-level
success, failure, and inapplicable objects plus nested list items and safe-error objects discard
additive own fields and return fresh known-field-only projections. Unsupported versions, missing or
invalid known fields, and invalid semantic combinations still fail safely.

The node adds no adapter, transport, route, preload, renderer, filesystem, infrastructure,
composition, fixture, shared-kernel, package/config, or research path. It mounts no product behavior
and runs no real app, runtime, project, provider, browser, server, or filesystem integration.

## Review and successor boundary

The regenerated `.codex-handoff/phase-01-p1-1d.json` returns a candidate for independent review. A
reviewer distinct from this router author and every P1.1D producer must return `ACCEPT` before any
separately authorized integration. Neither a green producer nor independent `ACCEPT` advances P1.R2,
P1.I, P1.F, or Phase 2+. Those nodes remain blocked until a later docs-only router is itself reviewed,
policy-integrated, and owned by a live successor controller.

The authoritative dependency and ownership projection is [`execution-dag.md`](execution-dag.md).
