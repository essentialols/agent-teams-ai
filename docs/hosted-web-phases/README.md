# Hosted Web execution router

Always begin with [`START_HERE.md`](START_HERE.md). This router selects the executable phase; it does
not redefine product architecture or turn preserved evidence into worker instructions.

## Fixed route

1. Read the baseline in `START_HERE.md`.
2. Confirm the tier and phase status in [`EXECUTION_INDEX.json`](EXECUTION_INDEX.json).
3. Read the current controller packet named by the subscription-runtime `worker-start-v1` contract.
4. Read exactly one assigned lane packet.
5. Read only exact lane references listed in that runtime contract.

On conflict, stop with `packet_conflict`. A packet or directive may narrow its authority but may not
broaden scope, change an ADR, weaken a guardrail, or skip an exit gate.

## Current execution

Phase 0 is accepted and frozen at `f4fa24aac9615a4ce10632965a2244a2e11a273e`. Its controller packet
and W1-W6 lanes are preserved history, not executable work.

Phase 1 is current. Serial bootstrap `P1.S0` is accepted at
`6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`, which is an ancestor of the transition base
`f12a85af0fddadd06f69a27ef408d26bc27eb3fc`. The six bootstrap evidence paths remain byte-for-byte
unchanged, and their historical `phaseStartSha` remains
`5f30df49e052d1cc1d0e7efd03aa105673b5b614`.

Integrated P1.S1 commit `da9625e78c0c96699162793a7ebba0657140d937` is the remediation base. The
authoritative operator-provided independent integration review finding is:

> "Independent integration review formally REJECTED P1.S1 commit da9625e78 only for incomplete
> P1.NEG.SCHEMA_VERSION."

All useful integrated kernel work remains in place. Authorization is now deliberately limited to one
future serial P1.S1 schema-version remediation node. A subscription-runtime `worker-start-v1`
contract must bind the current [`controller packet`](phase-01/controller-packet.md) and exactly one
lane packet: the bounded
[`P1.S1 schema-version remediation packet`](phase-01/lanes/p1-s1-schema-version-remediation.md).
Only after this docs-only router packet is integrated may that worker start or read the exact
contract-listed references. The remediation packet explicitly supersedes
`phase-01-s1-foundations-r1` as worker-start authority. `P1.S2` and every later producer remain
blocked; no route/catalog, conformance, feature-slice, review, integration, or production transport
work is authorized.

## Evidence boundary

`docs/research/hosted-web` is a preserved evidence corpus. Never recursively read that directory.
A worker may read one of its files only when the assigned packet lists that exact path. Evidence is
retained unchanged under [`EVIDENCE_LIFECYCLE.md`](EVIDENCE_LIFECYCLE.md).

## Start and completion

The hosting controller may admit the one future remediation worker only through
subscription-runtime's builtin `worker-start-v1` boundary after packet integration. The node is
one-shot: no retry loop, refill, duplicate producer, or automatic successor is authorized. Completion
states are `verified`, `characterized`, `blocked`, `failed`, or `superseded`; vague states such as
`done` are not evidence. This product repository supplies the packets and evidence inputs, not the
hosted-worker orchestration engine, and this packet production does not launch the worker.
