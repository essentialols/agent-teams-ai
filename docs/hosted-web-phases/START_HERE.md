# Hosted-web execution: start here

This is the canonical entrypoint for every hosted-web controller and worker. Phase 0 is accepted and
frozen at `f4fa24aac9615a4ce10632965a2244a2e11a273e`. Phase 1 serial bootstrap, foundations,
routes, conformance, and formal P1.R1 are accepted. The original P1.1D router is canonical at
`1b37afb02bec25a1f08432d733595b553101ecab`, but the P1.1D r3 implementation candidate was
independently rejected and was never integrated.

## Deterministic reading order

Read only this bounded sequence before working:

1. `AGENTS.md`.
2. This file.
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`.
4. `docs/hosted-web-phases/README.md`, then `docs/hosted-web-phases/EXECUTION_INDEX.json`.
5. The current `docs/hosted-web-phases/phase-01/controller-packet.md` named by the
   subscription-runtime `worker-start-v1` contract.
6. The single assigned remediation packet:
   `docs/hosted-web-phases/phase-01/lanes/p1-1d-additive-response-remediation.md`.
7. Only the exact files and plan headings in that packet's mandatory-read list.

Do not recursively explore documentation or evidence directories. Preserved research, accepted
P1.R1 evidence, and the rejected r3 artifact are immutable inputs, not writer paths.

## Current route and start gate

The sole current node is `P1.1D-additive-response-remediation`. Capacity is zero until this exact
seven-path docs-only router is policy-integrated after canonical router commit
`1b37afb02bec25a1f08432d733595b553101ecab` and a successor controller reports exactly
`live=true`. Only then may the hosting controller admit one serial remediation producer through the
subscription-runtime builtin `worker-start-v1` boundary. The runtime must bind the integrated
remediation-router commit as both `planBundleCommit` and `phaseStartSha`, canonical commit
`1b37afb02bec25a1f08432d733595b553101ecab` as `baseSha`, the current controller packet, and the
one remediation packet. This repository contains no hosted-worker admission or launch
implementation.

## Rejected r3 provenance

Independent review returned formal `REJECT` with one P1 finding: same-version response parsers
exact-key rejected additive fields for success, failure, inapplicable, and nested item values,
contrary to the frozen Phase 1 response-compatibility policy. Requests correctly remained strict.

The rejected subscription-runtime patch is
`a7d5539e68e62b1c64e5cdf663bc784d92d4db03e74a0087e29d9bb3b2faa7ee`, produced by
`agent-teams-hosted-web-refactor-p1-1d-producer-v17-r3` from canonical router commit
`1b37afb02bec25a1f08432d733595b553101ecab`. Its nine-path output and review record remain immutable
rejected evidence. They are not integrated, canonical, or executable authority. A remediation
producer may consume that artifact read-only and reproduce useful work into a fresh candidate; it
must never modify, relabel, or revive the rejected artifact or reuse its handoff/hashes as fresh
proof.

## Authority and blocked successors

[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json) classifies current authority and preserved history. A
lower tier may narrow work but cannot broaden scope or weaken a guardrail. Existing evidence remains
immutable under [`EVIDENCE_LIFECYCLE.md`](EVIDENCE_LIFECYCLE.md).

The current route authorizes only one fresh nine-path P1.1D additive-response remediation candidate.
It authorizes no IPC or HTTP adapter, preload or renderer work, filesystem adapter, production mount,
fake browser implementation, real runtime, integration, commit, push, or launch by this docs author.
The candidate must pass every original P1.1D gate and a distinct independent review must return
`ACCEPT` before any separately authorized integration. P1.R2, P1.I, P1.F, and Phase 2+ remain blocked
even after remediation or independent acceptance; only a later policy-integrated docs-only router
with its own live successor controller may advance them.
