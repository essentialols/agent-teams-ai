# Phase 0 current canonical controller indexes

This directory is the controller-owned current-state authority for Phase 0. It resolves
`P0.C1.IDENTITY.001` and `P0.C1.STALE.001` without changing any producer, reviewer, audit, baseline,
ledger, or other historical evidence.

The one true `phaseStartSha` is
`a32f509e6d9bd31ba2135940e336729bf90c3d93`. The current integration commit is
`0bf8f2d105def1fa34dd8dedfb8d345d720dc35e`. A remediation base, review base, lane source base, or
later integration commit must not be interpreted as the phase start.

Current authority is split by concern:

- `lane-identity-index.json` maps the integrated remediations to canonical lanes W1-W6.
- `review-disposition-index.json` records the current review/adoption disposition and exact hashed
  sources.
- `decision-index.json` records the controller's current decisions, including both C1 resolutions.
- `evidence-index.json` gives every current evidence ID an exact lane, path, SHA-256, proof level, and
  integration commit.
- `supersession-index.json` identifies the historical claims that no longer represent current state.
  Supersession never changes or invalidates the historical bytes as evidence of what was recorded.

W2 correction is explicit: its historical files claim
`phaseStartSha=c72fd201867b9bcd1ef77d5e0f95ba379adb4fca`. That SHA is the W2 source/integration base. It is
not the Phase 0 start. Every affected immutable path and its current SHA-256 is enumerated in the
supersession index.

Run the repository-portable gate with:

```bash
node docs/research/hosted-web/phase-0/freeze/current-canonical/verify-indexes.mjs
```

The controller environment can additionally re-hash external review records with:

```bash
node docs/research/hosted-web/phase-0/freeze/current-canonical/verify-indexes.mjs --include-controller-external
```

The gate validates all five indexes against `canonical-index.schema.json`, verifies repository path
hashes and cross-index lane/integration invariants, and proves the omission, stale-hash, and
duplicate-ID fixtures fail with their expected diagnostics.
