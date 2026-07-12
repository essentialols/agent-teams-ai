# Hosted-web orchestration tools

These dependency-free Node.js tools turn the evidence and worker orchestration rules into deterministic,
fail-closed checks. They never launch a worker or change an evidence artifact.

| Tool                               | Purpose                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `generate-evidence-catalog.mjs`    | Hash and sort a metadata source into a new catalog path. Refuses to overwrite an existing output.  |
| `validate-evidence-catalog.mjs`    | Validate catalog semantics, supersession links, exact paths, canonical SHA, and on-disk hashes.    |
| `validate-worker-start.mjs`        | Diagnostic validation of one worker's exact start inputs; never authorizes launch by itself.       |
| `validate-orchestration-state.mjs` | Validate work-key uniqueness, retry limits, statuses, and reciprocal acyclic supersession.         |
| `validate-worker-admission.mjs`    | Required combined launch gate binding one contract to one exactly matching queued registry record. |
| `orchestration-state.mjs`          | Capacity-aware initial admission and immutable atomic-refill candidate construction.               |

Run the focused contract tests with:

```text
node --test test/architecture/hosted-web/orchestration/*.test.mjs
```

The atomic-refill helper enforces serialized `maxInFlight` eligibility, preserves the predecessor's
refillable terminal status, validates a complete before/after state, and does not mutate its input.
Actual multi-host atomicity requires the separate durable shared-runtime enforcement described in
`docs/hosted-web-phases/ORCHESTRATION_GUARDS.md`.
