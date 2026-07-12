# Hosted-web execution: start here

This is the canonical entrypoint for a hosted-web controller or worker. The contract's reviewed
provenance is pinned to `42ec333848e29e97c41699b9fed73ed199740e3f`; that provenance is deliberately
separate from the contract-bound `phaseStartSha`. A worker starts only when its worktree HEAD equals
`phaseStartSha`, so integrating these guards does not make them reject their own later commit.

## Required reading order

1. `AGENTS.md`, `CLAUDE.md`, and `AGENT_CRITICAL_GUARDRAILS.md`.
2. This file.
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`.
4. `docs/hosted-web-phases/ORCHESTRATION_GUARDS.md`.
5. The active controller packet and exactly one assigned lane packet.
6. Only the source, fixtures, and checks named by the validated worker-start contract.

The parent plan remains the architecture and release authority. It is not a worker prompt. The packet
router in `docs/hosted-web-phases/README.md` selects the executable phase and explains packet
precedence.

## Fail-closed start gate

Before a worker is launched, the controller must run the combined gate:

```text
node scripts/hosted-web/orchestration/validate-worker-admission.mjs --contract <absolute-contract-path> --state <absolute-state-path>
```

The combined gate runs the worker-start and registry validators, then requires the contract's
`workKey` to resolve to exactly one `queued` registry record. Job, worker, phase, lane, provenance,
phase start, packet revision and paths, patch, review kind, retry/revision, and supersession identity
must agree exactly. An empty registry or terminal record fails closed.

The worker contract must name the active Phase 0 controller packet and exactly one W1-W6 lane packet,
and both paths are mandatory reads. The blocked, non-authoritative Phase 1 proposal is not a valid
worker packet and cannot be admitted. Validation success is admission evidence, not permission to use
a real project.

## Non-destructive evidence rule

Existing and archived agent work is immutable input. Controllers, generators, validators, workers,
and reviewers must not delete, move, rename, truncate, or overwrite it. A correction is a new artifact
with a review disposition and, when applicable, an explicit supersession link. See
`EVIDENCE_LIFECYCLE.md` for authority and retention rules.

## Enforcement boundary

The repository scripts are deterministic contract gates and test or controller tooling. They do not
by themselves serialize multiple hosts. Durable admission, atomic refill, and duplicate rejection in
the shared runtime are a separate required hardening item and must be completed before concurrent
hosted execution is considered enforced.
