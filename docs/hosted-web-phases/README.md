# Hosted Web execution router

Always begin with [`START_HERE.md`](START_HERE.md). This router selects the executable phase; it does
not redefine product architecture or turn preserved evidence into worker instructions.

## Fixed route

1. Read the baseline in `START_HERE.md`.
2. Confirm the tier and phase status in [`EXECUTION_INDEX.json`](EXECUTION_INDEX.json).
3. Read the current controller packet named by the worker-start contract.
4. Read exactly one assigned lane packet.
5. Read only exact lane references listed in that validated contract.

On conflict, stop with `packet_conflict`. A packet or directive may narrow its authority but may not
broaden scope, change an ADR, weaken a guardrail, or skip an exit gate.

## Current execution

Phase 0 is the only executable phase. Its controller entrypoint is
[`docs/hosted-web-phase-0-execution-packet.md`](../hosted-web-phase-0-execution-packet.md); a worker's
contract selects exactly one W1-W6 lane packet beneath `phase-00/lanes/`.

[`phase-01/README.md`](phase-01/README.md) is a blocked planning proposal and is reference-on-demand,
not worker authority. Later phases remain blocked until the preceding phase is reviewed and frozen.

## Evidence boundary

`docs/research/hosted-web` is a preserved evidence corpus. Never recursively read that directory.
A worker may read one of its files only when the assigned packet lists that exact path. Evidence is
retained unchanged under [`EVIDENCE_LIFECYCLE.md`](EVIDENCE_LIFECYCLE.md).

## Start and completion

The controller admits a worker only after the bounded worker-start validator and the registry
admission gate both succeed for exactly one `queued` record. Completion states are `verified`,
`characterized`, `blocked`, `failed`, or `superseded`; vague states such as `done` are not evidence.
