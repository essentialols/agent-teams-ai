# Hosted-web execution: start here

This is the canonical entrypoint for every hosted-web controller and worker. Phase 0 is accepted and
frozen at `f4fa24aac9615a4ce10632965a2244a2e11a273e`. Phase 1 serial bootstrap is accepted at
`6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`, P1.S1 is accepted at
`041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`, and P1.S2 is independently accepted and
policy-integrated/pushed in canonical commit `6a9e9ab714359638fb93a6880855a53c9e8ef4be`.

## Deterministic reading order

Read only this bounded sequence before working:

1. `AGENTS.md`.
2. This file.
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`.
4. `docs/hosted-web-phases/README.md`, then `docs/hosted-web-phases/EXECUTION_INDEX.json`.
5. The current `docs/hosted-web-phases/phase-01/controller-packet.md` named by the
   subscription-runtime `worker-start-v1` contract.
6. The single assigned P1.R1 lane packet: `docs/hosted-web-phases/phase-01/lanes/p1-r1-review.md`.
7. Only the exact files in that packet's mandatory-read and review-input lists.

Do not recursively explore documentation or evidence directories. In particular,
`docs/research/hosted-web` is preserved evidence, not a reading queue. The only current write
exception is the new P1.R1 result at the one exact path assigned by the current packet; no existing
research evidence may be edited.

## Start gate

The P1.R1 route is authorized but not self-starting. The formal reviewer is forbidden until this exact
seven-path docs-only router commit is integrated after canonical P1.S2 and a successor controller
reports `live=true`. Only then may the hosting controller admit exactly one reviewer through
subscription-runtime's builtin `worker-start-v1` boundary, binding the integrated router commit as
both `planBundleCommit` and `phaseStartSha`, canonical P1.S2 commit
`6a9e9ab714359638fb93a6880855a53c9e8ef4be` as `baseSha`, the controller packet, and the one current
review packet. This repository contains no hosted-worker admission or launch implementation.

## Authority and preservation

[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json) classifies execution authority, current-phase inputs,
and preserved history. A lower tier may narrow work but cannot broaden scope or weaken a guardrail.
Existing evidence is immutable input under [`EVIDENCE_LIFECYCLE.md`](EVIDENCE_LIFECYCLE.md).

P1.S2 routes commit `74038b54eee23e93798b3aa5d11411d3f7e9adcf` and conformance commit
`6a9e9ab714359638fb93a6880855a53c9e8ef4be` are independently accepted and
policy-integrated/pushed. The independent admission reviewer
`agent-teams-hosted-web-refactor-p1-s2-admission-review-v15-r2` accepted combined input
`02a6b3ac5ac2baaad55c413f8547252dddee4d41`, whose tree is byte-identical to canonical P1.S2. That
admission permits this router transition; it does not substitute for formal P1.R1 review.

The current route authorizes one independent P1.R1 reviewer and no producer or integrator. P1.1D,
P1.R2, integration, P1.F, and Phase 2+ remain blocked even after a formal `ACCEPT`; only a later
docs-only router may advance them.
