# Hosted-web execution: start here

This is the canonical entrypoint for every hosted-web controller and worker. Phase 0 is accepted and
frozen at `f4fa24aac9615a4ce10632965a2244a2e11a273e`. Phase 1 serial bootstrap is accepted at
`6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`, and the independently accepted P1.S1 remediation is
integrated in canonical commit `041b5c7c2d3225b7dc2eca9e9b7b71aa33217060`.

## Deterministic reading order

Read only this bounded sequence before working:

1. `AGENTS.md`.
2. This file.
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`.
4. `docs/hosted-web-phases/README.md`, then `docs/hosted-web-phases/EXECUTION_INDEX.json`.
5. The current `docs/hosted-web-phases/phase-01/controller-packet.md` named by the
   subscription-runtime `worker-start-v1` contract.
6. Exactly one assigned P1.S2 lane packet: `p1-s2-routes.md` or `p1-s2-conformance.md`.
7. Only the exact files in that contract's `mandatoryDocs`, `mandatoryScripts`, and
   `mandatoryFixtures` lists.

Do not recursively explore documentation or evidence directories. In particular,
`docs/research/hosted-web` is preserved evidence, not a reading queue. Read a file beneath it only
when the assigned packet lists that exact repository-relative path. Directory paths, globs, and
recursive patterns are invalid mandatory reads.

## Start gate

The P1.S2 route is authorized but not self-starting. A product worker is forbidden until this exact
docs-only router commit is integrated and a successor controller reports `live=true`. Only then may
the hosting controller admit a worker through subscription-runtime's builtin `worker-start-v1`
boundary, binding the integrated router commit as both `planBundleCommit` and `phaseStartSha`, the
canonical P1.S1 commit as `baseSha`, the controller packet, and exactly one current lane packet.
This repository contains no hosted-worker admission or launch implementation.

## Authority and preservation

[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json) classifies execution authority, current-phase inputs,
on-demand references, and preserved history. A lower tier may narrow work but cannot broaden scope or
weaken a guardrail. Existing evidence is immutable input under
[`EVIDENCE_LIFECYCLE.md`](EVIDENCE_LIFECYCLE.md).

The accepted P1.S0 evidence paths and historical P1.S0 `phaseStartSha`
`5f30df49e052d1cc1d0e7efd03aa105673b5b614` remain immutable. Canonical commit
`041b5c7c2d3225b7dc2eca9e9b7b71aa33217060` records the independently accepted and integrated P1.S1
kernel plus schema-version remediation. The current route authorizes exactly two parallel,
non-overlapping P1.S2 producers: P1.1B route/catalog plus capability assertions, and P1.1C
conformance plus ratchets. P1.S3 and every later subphase remain blocked.
