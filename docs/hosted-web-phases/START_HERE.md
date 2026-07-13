# Hosted-web execution: start here

This is the canonical entrypoint for every hosted-web controller and worker. Phase 0 is accepted and
frozen at `f4fa24aac9615a4ce10632965a2244a2e11a273e`. Phase 1 serial bootstrap, foundations,
routes, and conformance are accepted. Formal P1.R1 review is `ACCEPT` and policy-integrated at
canonical commit `759a5d4f45c2142485a0acc13760f3de4d0ff6ea`.

## Deterministic reading order

Read only this bounded sequence before working:

1. `AGENTS.md`.
2. This file.
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`.
4. `docs/hosted-web-phases/README.md`, then `docs/hosted-web-phases/EXECUTION_INDEX.json`.
5. The current `docs/hosted-web-phases/phase-01/controller-packet.md` named by the
   subscription-runtime `worker-start-v1` contract.
6. The single assigned P1.1D lane packet:
   `docs/hosted-web-phases/phase-01/lanes/p1-1d-team-lifecycle-read.md`.
7. Only the exact files and plan headings in that packet's mandatory-read list.

Do not recursively explore documentation or evidence directories. In particular,
`docs/research/hosted-web` is preserved evidence, not a reading queue. The accepted P1.R1 result is
an immutable input; this route grants no research-evidence write exception.

## Start gate

P1.1D is authorized but not self-starting. Its sole producer is forbidden until this exact seven-path
docs-only router commit is policy-integrated after canonical P1.R1 and a successor controller reports
exactly `live=true`. Only then may the hosting controller admit one producer through
subscription-runtime's builtin `worker-start-v1` boundary, binding the integrated router commit as
both `planBundleCommit` and `phaseStartSha`, canonical P1.R1 commit
`759a5d4f45c2142485a0acc13760f3de4d0ff6ea` as `baseSha`, the controller packet, and the one current
P1.1D packet. This repository contains no hosted-worker admission or launch implementation.

## Accepted P1.R1 provenance

Formal reviewer `agent-teams-hosted-web-refactor-p1-r1-review-v16-r1` returned `ACCEPT`. The review
evidence is policy-integrated in canonical commit `759a5d4f45c2142485a0acc13760f3de4d0ff6ea` and records:

- P0 findings: 0;
- P1 findings: 0;
- P2 findings: 0;
- routes: 16/16; and
- conformance: 13/13.

The result accepts P1.S2 routes, capabilities, conformance, and ratchets. It does not prove the first
team-lifecycle list use case or authorize a transport, mount, runtime, or later phase.

## Authority and preservation

[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json) classifies execution authority, current-phase inputs,
and preserved history. A lower tier may narrow work but cannot broaden scope or weaken a guardrail.
Existing evidence is immutable input under [`EVIDENCE_LIFECYCLE.md`](EVIDENCE_LIFECYCLE.md).

The current route authorizes exactly one serial P1.1D product node for a transport-neutral
team-lifecycle read/list proof. It authorizes only the packet's exact product, test, and handoff paths.
It authorizes no IPC or HTTP adapter, preload or renderer work, filesystem adapter, production mount,
fake browser implementation, real runtime, review, integration, or release work. P1.R2, P1.I, P1.F,
and Phase 2+ remain blocked even after the producer finishes; only a later docs-only router may
advance them.
