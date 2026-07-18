# Start here: PR #252 latest-base sync

## Orientation for incoming agents (read this first)

- **What is already DONE — do not re-implement.** The Phase 2 identity product wave is accepted and
  integrated (`eee2389f7`), and canonical team lifecycle reads are already **wired into production**
  (IPC, HTTP, preload, and standalone via `src/main/composition/hosted/phase2ReadComposition.ts`)
  in `bc893aa16`. Every `phase-02/` packet is a historical record of that finished work.
- **The only executable node right now** is the PR #252 latest-base sync described below, and its
  admission is owned by the project controller (`ProjectScopedControl`). If you are an implementer
  without that controller mandate, there is no product task to pick up here until the sync merge
  lands; do not start Phase 2 work from the historical packets.
- **Head pins are live-resolved.** The first merge parent is the live PR #252 branch head resolved
  once at attempt prepare/start; SHAs printed in these documents are authoring-time records, and
  later accepted commits on the branch supersede them without a new router revision. The full-SHA
  stop rule below applies to the attempt-bound binding contract, not to a plain difference between
  the documents' authoring-time SHAs and the current branch head.
- **Known red tests** on this branch are tracked in [KNOWN_RED.md](KNOWN_RED.md) with causes and
  resolution steps — expect them, do not rediscover them.
- **There is no `phase-03/` packet yet.** After the sync merge lands, the next phase packet must be
  authored first; do not search for it.
- Process guidance for keeping lanes fast is in [VELOCITY.md](VELOCITY.md) (reference, not
  mandatory reading).

## Router authority

- Revision: `pr252-latest-base-sync-router-v2` (v2: owner refresh — canonical head advanced past
  `81e79295e` after accepted commits `eceeb805c` (stop-delivery hardening) and `bc893aa16`
  (phase-2 read wiring); head pinning replaced with live-resolve-at-attempt-start)
- Router/canonical head at authoring time: `bc893aa16385aab1487049bfd4d5e9365f0a70e0`
- Historical product-wave provenance: `eee2389f7ee9300df93ef02d92e9ae114949aff4`, accepted,
  integrated, and an ancestor of the active router
- Current blocker: latest-base sync only
- Terminal state: `HOLD`

The Phase 2 milestone and next phase remain blocked until a reviewed true two-parent sync merge is
pushed and GitHub proves PR #252 non-conflicting for the same attempt-bound head/base pair. Earlier
Phase 2 candidate/product-launch wording and every stale PR #252 source pin are superseded.

## Mandatory read order

Every PR #252 latest-base-sync actor reads these items completely and in this order:

1. repository [AGENTS.md](../../AGENTS.md);
2. this file;
3. [EVIDENCE_LIFECYCLE.md](EVIDENCE_LIFECYCLE.md);
4. [hosted-web packet README](README.md);
5. [EXECUTION_INDEX.json](EXECUTION_INDEX.json);
6. [Phase 1 navigation record](phase-01/README.md);
7. [controller packet](phase-01/controller-packet.md);
8. [execution DAG](phase-01/execution-dag.md);
9. [latest-base conflict lane](phase-01/lanes/pr252-base-conflict-resolution.md);
10. repository [CLAUDE.md](../../CLAUDE.md);
11. [critical guardrails](../../AGENT_CRITICAL_GUARDRAILS.md);
12. [feature architecture standard](../FEATURE_ARCHITECTURE_STANDARD.md);
13. [packet standard](PACKET_STANDARD.md);
14. [orchestration responsibility boundary](ORCHESTRATION_GUARDS.md);
15. the immutable `pr252.latest-base-binding/v1` pre-start contract; and
16. the exact attempt-bound conflict paths and their nearest focused tests.

Stop on any revision, authority, attempt ID, full SHA, conflict-path, parent-order, scope, or
dependency mismatch. Return `HOLD`; do not repair authority informally.

## Admission rule

The router author launches nothing. After these exact seven paths become active packet authority,
`ProjectScopedControl` may atomically prepare/start one product attempt. During that single
transition it resolves the live PR base once, records the exact full commit, materializes the product
worker from `bc893aa16385aab1487049bfd4d5e9365f0a70e0`, derives the actual conflict set, and binds the
canonical head and same base as ordered first and second parents.

The producer edits only actual conflict paths, preserves both parent behaviors, runs focused tests and
all mechanical gates, self-reviews, and ends `HOLD`. The controller reruns the complete mechanical
gate set directly. There is no mechanical-review worker. Exactly one fresh independent combined
integration/architecture/security semantic reviewer may follow.

Only that review's `ACCEPT` with P0/P1/P2 `0/0/0` permits broker construction, promotion, push,
and GitHub conflict proof of the exact ordered two-parent merge. The broker uses canonical head
`bc893aa16385aab1487049bfd4d5e9365f0a70e0` as the expected old PR head and the merge's first
parent. A live-base mismatch at any later gate invalidates only the attempt; the same stable packet
admits a new atomic attempt after the old one is terminal.

## Safety and provenance

Use no real projects, agent-team launch/provisioning, product terminal, smoke flow, provider/auth
flow, raw lifecycle operation, other repository, broad docs edit, or Fast mode. Runtime primitives do
not choose the DAG.

The merge commit SHA and its ordered parents are primary provenance. Runtime-owned attempt and review
records may bind the attempt ID, tree SHA, commands, and findings, but no repository handoff manifest
or hash-of-manifest ledger is created. All actors and this router end `HOLD`; launch no successor.
