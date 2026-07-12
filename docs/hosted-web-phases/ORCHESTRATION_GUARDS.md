# Hosted-web orchestration guards

## Worker-start contract

Every launch consumes one JSON contract conforming to
`docs/hosted-web-phases/worker-start-contract.schema.json`. The controller must validate it before
creating a runtime process. A valid contract binds the worker to:

- canonical provenance/base SHA `42ec333848e29e97c41699b9fed73ed199740e3f` and a separately
  bound `phaseStartSha` that must equal worktree HEAD;
- the authorized Phase 0 packet revision, active controller packet, and exactly one matching W1-W6
  lane packet; both packet paths must also occur in `mandatoryDocs`;
- one job, worker, phase, lane, review kind, revision, and deterministic `workKey`;
- one absolute `jobRoot` and a prompt contained below it;
- normalized repository-relative owned paths with no globbing or traversal;
- the six repository/start/evidence/orchestration guard documents plus non-empty exact lists of
  lane-specific documents, scripts, fixtures, and checks;
- `sandbox-only` execution below an explicit sandbox root; and
- a forbidden-real-project list that includes `~/dev/projects/ai/claude-runtime`.

Missing paths, resolved symlink target type mismatches, symlink escapes, duplicate entries, path
aliases such as `./x`, wildcard paths, and a prompt or sandbox outside `jobRoot` fail closed. A
successful gate does not execute the required checks; it proves that the exact commands and inputs
were admitted.

The launch gate is `validate-worker-admission.mjs`, not either standalone validator. It requires
exactly one registry record for the contract `workKey`; the record must be `queued`, have no
terminal supersession metadata, and agree with every launch identity field. Standalone validators are
diagnostic building blocks and cannot authorize a process.

## Deterministic work identity

The work-key input is the ordered tuple:

```text
phaseId, laneId, baseSha, phaseStartSha, packetRevision, inputPatchHash, reviewKind, revision
```

`workKey` is lowercase SHA-256 over the canonical JSON encoding of those named fields in that order.
Changing any component produces a different key. The clear-text components remain in every registry
record so an operator can audit the digest.

The registry rejects an exact key if it is already in an in-flight state (`queued`, `running`, or
`reviewing`) or a terminal state (`verified`, `characterized`, `blocked`, `failed`, `rejected`, or
`superseded`). Revision changes are not an escape hatch: a later revision is a refill and must name the
terminal record it supersedes.

## Retry and supersession rules

- Initial admission has revision `0`, retry count `0`, and no `supersedes` value.
- Only `failed` or `blocked` terminal work may be refilled.
- A refill preserves phase, lane, base SHA, input patch hash, and review kind; increments revision and
  retry count by exactly one; and names the immediate predecessor work key in `supersedes`.
- A predecessor may have at most one direct successor. The chain must be acyclic and each link must be
  reciprocal through the registry's derived `supersededBy` relationship.
- `retryCount` may not exceed the registry's `maxRetries`. Reaching the limit requires controller
  intervention and a newly reviewed packet, not another worker.
- Verified, characterized, rejected, or already-superseded work cannot be refilled.

## Atomic-refill-only

Refill is one compare-and-swap transaction owned by the shared runtime:

1. verify that the predecessor is still terminal and has no successor;
2. verify the serialized state's `maxInFlight` capacity, retry limit, work identity, and duplicate
   exclusion;
3. mark the predecessor `superseded` and insert the replacement; and
4. commit both changes before any worker process is launched.

Never free a slot, launch a process, and write the successor as separate operations. The repository
helper counts `queued`, `running`, and `reviewing` records against `maxInFlight`, rejects a
refill when capacity is already consumed, preserves the predecessor's `failed` or `blocked` status
in `supersededFrom`, and leaves input unchanged on failure. A JSON file or in-process helper still
cannot provide multi-host serialization.

The current Phase 1 controller document is a blocked proposal, not a launch authority. Until the
Phase 0 freeze and Phase 1 authorization gates materialize a reviewed packet, no Phase 1 worker
contract or registry admission is valid.

## Separate shared-runtime hardening requirement

Before hosted parallel workers are enabled, the shared runtime must enforce these same rules against a
durable authoritative registry with a transaction, uniqueness constraint on `workKey`, predecessor
compare-and-swap, and launch-after-commit ordering. All launch paths, including reviews, remediations,
manual retries, crash recovery, and capacity refill, must call that single admission boundary.

This hardening is separate from the documentation and repository validators in this directory. The
validators make the contract executable and testable; they do not claim that current production
runtime paths are already protected.
