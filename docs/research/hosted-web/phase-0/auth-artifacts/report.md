# Phase 0 W6 auth and standalone-artifact characterization

Canonical current-commit source: `6cf53a3d71e1bd34ff71f99968b705a0e1aa939c`.
Historical rejected-candidate provenance is retained separately and is not current-commit authority.
Historical producer phase start: `a32f509e6d9bd31ba2135940e336729bf90c3d93`.
Packet narrowing: `phase-00-r3`.

This lane is contract characterization only. It enables no authentication, CORS, remote mutation,
route, cookie, migration, production composition, terminal behavior, or hosted capability.

## Reset and drain contract

The executable model directly consumes controller envelope
`P0.CONTROLLER.W4_W6.DRAIN_EVIDENCE_ENVELOPE.V1`, pinned to
`docs/research/hosted-web/phase-0/w4-w6-contract/drain-evidence-envelope.schema.json` and its
SHA-256. It accepts only the envelope's exact ready and drained objects and never adds a W6-owned
source or authority wrapper. The drained record binds `purpose`, `resetGeneration`,
`deploymentGeneration`, and `processAnchorGeneration`; mismatch in any field rejects. Protocol,
anchor identity, nonce, pidfd/process-group readiness, classification and empty residuals are also
fail-closed.

While `resetIntent` exists, bootstrap, pair and renew reject with `reset_in_progress`. Restart and all
remaining transitions preserve `mutationAdmission=false` at every durable reset stage. These are
fixture-characterized invariants, not remote-auth or remote-mutation readiness.

## One controller-owned artifact authority

The controller-owned source is
`docs/research/hosted-web/phase-0/w4-w6-contract/controller-artifact-contract.json`, with its adjacent
schema. W4 and W6 load that exact path and SHA-256 and expose equal read-only projections. The
cross-lane suite rejects a missing artifact, extra artifact, renamed field, stale path, and stale
protocol hash. Neither lane owns a competing path or hash table.

## Standalone disposition and terminal rule

`observed-artifact-scan.json` is the sole exact current-commit standalone-characterization authority.
Its seven emitted CJS rows come from the configured targeted Vite build of canonical source commit
`6cf53a3d71e1bd34ff71f99968b705a0e1aa939c` into an ephemeral directory. The verifier performs that
targeted build again and compares the complete record, including every relative path, byte count and
SHA-256. It never accepts a mutable ambient `dist-standalone` as evidence.

`historical-rejected-candidate-artifact-scan.json` separately preserves the rows and provenance from
rejected integration attempt `a8405fd56102c02a0319e197c5b1b892d612616e39e5e871167cdb42798d5767`.
That record is historical contradiction evidence only. The manifest and current evidence project the
semantic hash of `observed-artifact-scan.json`; changing a current emitted hash fails closed.

The characterized standalone artifact is rejected for hosted v1. Its graph omits the internal-storage
worker, includes broad Electron/native stubs, copies production dependencies wholesale, and contains
terminal SDK/service surfaces. `proposed-hosted-artifact-manifest.json` therefore records all hosted
readiness claims as false; it is a rejection record, not a production manifest.

Terminal exclusion remains a v1 rule. The targeted current-commit build demonstrates that the current
artifact violates the rule, so exclusion is not claimed achieved. No final hosted image or production
composition is proposed or admitted by this remediation.

The estimate assumption is deliberately narrower than an artifact-admission claim: the existing
standalone source/build path may evolve in place, but evolution is unproved. The exact canonical
artifact above remains rejected, and any evolved candidate requires its own reviewed packet.

## Other current-host characterization

Artifact inventory and current terminal-rule evaluation are
`targeted_current_commit_build_observed`. Proxy/origin, auth transitions and ABI behavior remain
fixture/current-host characterization at their declared levels. No live edge, browser, keyring crash
schedule, Electron native load, final-image load, or production deployment was run.
