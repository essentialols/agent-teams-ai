# Hosted-web execution: start here

This is the canonical entrypoint for every hosted-web controller and worker. The reviewed provenance
is `42ec333848e29e97c41699b9fed73ed199740e3f`; each launch separately binds its exact worktree HEAD as
`phaseStartSha`.

## Deterministic reading order

Read only this bounded sequence before working:

1. `AGENTS.md`.
2. This file.
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`.
4. `docs/hosted-web-phases/README.md`, then `docs/hosted-web-phases/EXECUTION_INDEX.json`.
5. The current controller packet named by the validated worker-start contract.
6. The one assigned lane packet, followed only by the exact files in that contract's
   `mandatoryDocs`, `mandatoryScripts`, and `mandatoryFixtures` lists.

Do not recursively explore documentation or evidence directories. In particular,
`docs/research/hosted-web` is preserved evidence, not a reading queue. Read a file beneath it only
when the assigned packet lists that exact repository-relative file path. Directory paths, globs, and
recursive patterns are invalid mandatory reads.

## Start gate

Before launch, run the bounded worker-start validator, then validate its single queued registry
record:

```text
node scripts/hosted-web/orchestration/validate-worker-start.mjs --contract <absolute-contract-path>
node scripts/hosted-web/orchestration/validate-worker-admission.mjs --contract <absolute-contract-path> --state <absolute-state-path>
```

The contract must bind the current controller packet, exactly one lane packet, and the bounded read
set above. Validation success is admission evidence; it is not permission to use a real project.

## Authority and preservation

[`EXECUTION_INDEX.json`](EXECUTION_INDEX.json) classifies execution authority, current-phase inputs,
on-demand references, and preserved history. The parent plan and blocked Phase 1 proposal are not
worker prompts. A lower tier may narrow work but cannot broaden scope or weaken a guardrail.

Existing evidence is immutable input. Do not delete, move, rename, truncate, regenerate, or rewrite
it. Corrections use a new artifact and the lifecycle in
[`EVIDENCE_LIFECYCLE.md`](EVIDENCE_LIFECYCLE.md).
