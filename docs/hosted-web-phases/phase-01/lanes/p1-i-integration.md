# P1.I serialized adoption, rollback, and evidence-freeze lane

## Authority and provenance

- Project: `agent-teams-hosted-web-refactor`
- Phase/node: `phase-01` / `P1.I`
- Lane ID: `p1-i`
- Packet revision: `phase-01-p1-i-integration-r1`
- Router revision: `phase-01-p1-i-router-r1`
- Evidence IDs: `P1.I.INTEGRATION` and `P1.I.ROLLBACK`
- Router `packetBaseSha` and accepted P1.R2 evidence-integration SHA:
  `c5d842f75ca7a647a0773b0c30d303d7da21d1d6`
- Accepted P1.R2 review authority SHA:
  `f6794b607609c57dc92def696d05946c9c96856a`
- Accepted P1.R2 reviewed-product snapshot SHA:
  `666042037a9c91df572b1d8274bf6024f8d00f40`
- P1.S0 bootstrap SHA:
  `5f30df49e052d1cc1d0e7efd03aa105673b5b614`
- Producer `postIntegrationAuthoritySha`: intentionally unresolved until this router is independently
  accepted, broker-integrated, and pushed. It must never be guessed or set to `packetBaseSha`.
- Producer profile: `gpt-5.6-sol`, `xhigh`, and `serviceTier: "default"`. Fast is prohibited.
- Capacity: exactly one producer after the launch gate, then exactly one fresh independent P1.I
  milestone reviewer after the producer is terminal and immutable output is captured; no overlap,
  replacement, refill, or successor controller is authorized.
- Terminal state: `HOLD`.

The accepted P1.R2 evidence is already integrated at `c5d842f75…` with formal `ACCEPT` and P0/P1/P2
`0/0/0`. Its two files are immutable inputs. P1.I consumes them and must never edit, regenerate,
reformat, replay, stage, or reintegrate either path.

This router author starts nothing. Root remains the sole orchestrator. `controller-v17` remains
`HOLD` and observation-only; it cannot launch, admit, integrate, restart, replace itself, or create a
successor. Root may start the single producer only after the router has independent acceptance, the
broker has integrated and pushed it, and root has immutably attested the exact pushed authority.

## Mission

Perform serialized evidence adoption over the already integrated Phase 1 bytes, close every Phase 1
gate that this evidence-only node owns, prove a bounded forward/reverse rollback round trip, and
freeze the Phase 1 decision, estimate, evidence, and integration records.

Serialized adoption means recording and verifying already integrated bytes. It does not mean applying
producer patches, merging commits, rewriting product history, or performing raw Git integration. The
producer may write only the five JSON result paths below. It has no product, test, fixture, script,
configuration, package, lockfile, router, review, registry, or integration writer authority.

The producer must independently rerun the complete Phase 1 Vitest surface, the focused ratchet
negative, the frozen typecheck classification, full lint, Prettier, scope/diff gates, classified
safety scans, and scratch-only rollback/apply proof. It must freeze exact provenance and content
hashes for the 68 canonical Phase 1 inputs and its five outputs.

## Exact start gate and admission

Root must prove all of the following in one immutable pre-start snapshot:

1. this exact seven-path router has received independent acceptance, has been broker-integrated, and
   is pushed;
2. the broker returned one exact pushed commit and root resolved it as
   `postIntegrationAuthoritySha`;
3. the post-integration worktree is clean and the sole result of
   `git ls-remote origin refs/heads/refactor/hosted-web-feature-boundaries` is exactly that SHA;
4. an upstream-tracking ref is not used as remote equality evidence;
5. `c5d842f75ca7a647a0773b0c30d303d7da21d1d6` remains the exact accepted P1.R2 integration commit,
   has parent `f6794b607609c57dc92def696d05946c9c96856a`, and changes exactly the two frozen P1.R2 evidence
   paths;
6. both P1.R2 evidence hashes match this packet, the handoff says `ACCEPT`, and P0/P1/P2 are `0/0/0`;
7. every one of the 68 paths in `EXECUTION_INDEX.json.phase1CanonicalInputs` is byte-identical at
   `c5d842f75…` and `postIntegrationAuthoritySha`;
8. all five P1.I output paths are absent;
9. no P1.I producer is active and P1.F, Phase 2+, product work, integration, or successor-controller
   work is active;
10. the broker has materialized dependencies offline, and the worker is forbidden to install,
    fetch, or update them; and
11. admission requests exactly `gpt-5.6-sol`, `xhigh`, and the default service tier, with Fast
    prohibited.

Any mismatch ends `HOLD` without a launch. Root must use this exact stable admission shape; angle
brackets are runtime values, not packet literals:

```text
operation: codex_goal_project_refill_worker
workerRole: producer
reasoningEffort: xhigh
serviceTier: default
sourceRemote: origin
sourceBranch: refactor/hosted-web-feature-boundaries
expectedSourceCommit: <postIntegrationAuthoritySha>
preStartAdmission.mode: serial-builtin
preStartAdmission.contract.kind: worker-launch
preStartAdmission.contract.format: 1
preStartAdmission.contract.canonicalSha: <postIntegrationAuthoritySha>
preStartAdmission.contract.baseSha: <postIntegrationAuthoritySha>
preStartAdmission.contract.phaseStartSha: <postIntegrationAuthoritySha>
preStartAdmission.contract.packetRevision: phase-01-p1-i-integration-r1
preStartAdmission.contract.controllerPacket: docs/hosted-web-phases/phase-01/controller-packet.md
preStartAdmission.contract.lanePacket: docs/hosted-web-phases/phase-01/lanes/p1-i-integration.md
preStartAdmission.contract.phaseId: phase-01
preStartAdmission.contract.laneId: p1-i
preStartAdmission.contract.inputPatchHash: null
preStartAdmission.contract.reviewKind: implementation
```

A producer-side `prepare_verifier`, a second producer, a retry/refill, a different profile, a moving
source ref, and any producer-side network or remote query are forbidden. Only root may prepare the
one reviewer, after producer termination and immutable output capture. Handoff `baseSha`,
`canonicalSha`, `planBundleCommit`, `phaseStartSha`, and `headSha` all bind the resolved
`postIntegrationAuthoritySha`. Separate fields preserve the distinct accepted P1.R2 integration,
review authority, reviewed-product snapshot, and P1.S0 bootstrap SHAs.

## Exact mandatory reads

Read in this order. Directory reads, globs, recursive research reads, implicit siblings, and the
whole master plan are not authorized:

1. `AGENTS.md`
2. `docs/hosted-web-phases/START_HERE.md`
3. `docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`
4. `docs/hosted-web-phases/README.md`
5. `docs/hosted-web-phases/EXECUTION_INDEX.json`
6. `docs/hosted-web-phases/phase-01/controller-packet.md`
7. `docs/hosted-web-phases/phase-01/lanes/p1-i-integration.md`
8. `CLAUDE.md`
9. `AGENT_CRITICAL_GUARDRAILS.md`
10. `docs/FEATURE_ARCHITECTURE_STANDARD.md`
11. `docs/hosted-web-phases/PACKET_STANDARD.md`
12. `docs/hosted-web-phases/phase-01/README.md`
13. `docs/hosted-web-phases/phase-01/execution-dag.md`
14. `docs/hosted-web-phases/phase-01/architecture-and-contracts.md`
15. `docs/hosted-web-phases/phase-01/conformance-and-tests.md`
16. `docs/hosted-web-phases/phase-01/operations-and-risk.md`
17. `docs/hosted-web-phases/phase-01/packet-inputs.md`
18. the exact 68 paths in `EXECUTION_INDEX.json.phase1CanonicalInputs`, in this exact group and path
    order: `bootstrapPaths`, `p11aPaths`, `p11aRemediationProvenancePaths`, `p11bPaths`, `p11cPaths`,
    `p1r1Paths`, `p11dPaths`, and `p1r2Paths`.

The index contains every exact path, group count, total, and snapshot binding. It is the no-glob
machine manifest. The producer must expand it to 68 distinct existing paths before reading the first
one. Nothing outside the list becomes evidence merely because it is nearby.

## Exact exclusive writer authority

The producer creates exactly these five paths, in this order:

1. `.codex-handoff/phase-01-p1-i.json`
2. `docs/research/hosted-web/phase-1/decision-register.json`
3. `docs/research/hosted-web/phase-1/estimate-reconciliation.json`
4. `docs/research/hosted-web/phase-1/evidence-index.json`
5. `docs/research/hosted-web/phase-1/integration-report.json`

Everything else is read-only. A parent directory may be created only if required for one of these
paths. No temporary, generated, log, cache, patch, or scan output may be written inside the
repository. Verification scratch data belongs under a newly created task-owned temporary directory
outside the repository and must be removed narrowly after use.

## Required gate closure

The integration report must contain one explicit passing record for every exact ID below. A missing,
ambiguous, inherited-as-green, or merely plausible record fails the producer:

1. `P1.GATE.PROVENANCE` — all SHA roles, parentage, exact path sets, hashes, and authority bindings;
2. `P1.GATE.PREDECESSORS` — accepted P1.R1 and P1.R2 evidence, with P1.R2 `ACCEPT` 0/0/0;
3. `P1.GATE.SCOPE` — 68 immutable inputs and exactly five outputs, with no other repository change;
4. `P1.GATE.TESTS` — the full Phase 1 Vitest plus team-lifecycle command at 13/13 files and 59/59
   tests;
5. `P1.GATE.TYPECHECK` — exactly seven frozen inherited Phase 0 diagnostics, zero owned, and zero
   unexpected;
6. `P1.GATE.LINT` — full `pnpm lint` exits zero;
7. `P1.GATE.FORMAT` — exact 73-path Prettier check exits zero;
8. `P1.GATE.NEGATIVES` — every frozen negative is accepted, accepted by an explicit reviewed
   narrowing, or remains the one declared Phase 2 deferral with its reopen condition;
9. `P1.GATE.RATCHET` — `P1.NEG.RATCHET_REGRESSION` has fresh focused acceptance evidence;
10. `P1.GATE.SECURITY` — exact-scope secret/provider/private-path/binary scans are completely
    classified;
11. `P1.GATE.ROLLBACK` — exact 54-path forward and reverse scratch round trip succeeds without
    repository mutation;
12. `P1.GATE.ESTIMATE` — every unique bucket has exact actuals, no path is double-counted, and all
    variance is explicit;
13. `P1.GATE.DECISIONS` — all P1-GAP-001 through P1-GAP-010, risks, deferrals, narrowings, and
    unverified production claims have explicit dispositions; and
14. `P1.GATE.EVIDENCE_FREEZE` — the evidence catalog is internally coherent, hash-complete, and
    lifecycle-valid.

`P1.NEG.TEST_ROOT_ESCAPE` remains deferred to the first Phase 2 filesystem-backed adapter only while
the Phase 1 no-filesystem gate remains green. The decision register must preserve its exact owner,
reopen condition, and required future marked-root controls. It is not silently accepted or dropped.

## P1.NEG.RATCHET_REGRESSION acceptance evidence

Run the focused parity file independently even though it also runs in the full suite:

```bash
pnpm exec vitest run test/architecture/hosted-web/phase-1/parity/parity-references.test.ts
```

It must exit zero with exactly one file and 3/3 tests. The integration report must record, as
`P1.NEG.RATCHET_REGRESSION`, that:

- current pinned references and current maximum counts are the passing positive neighbor;
- a renamed source that raises the legacy channel debt is rejected;
- an expired quarantine is rejected;
- both failures use exact diagnostic `phase1-ratchet-regression`;
- the fixture path is
  `test/architecture/hosted-web/phase-1/fixtures/ratchet-regression.ts`;
- the focused test and scanner source hashes are recorded; and
- no ratchet maximum, expiry, exception, or semantic reference was relaxed to make the gate pass.

The decision register marks this evidence `accepted`. The evidence index records its accepted P1.R1
authority and the fresh P1.I re-verification without rewriting the original review result.

## Provenance and scope proof

After binding `postIntegrationAuthoritySha` and `expectedSourceCommit` from the immutable root
attestation, run these local checks without any network query:

```bash
test -n "$postIntegrationAuthoritySha"
test "$expectedSourceCommit" = "$postIntegrationAuthoritySha"
test "$(git rev-parse HEAD)" = "$postIntegrationAuthoritySha"
test "$(git rev-list --parents -n 1 c5d842f75ca7a647a0773b0c30d303d7da21d1d6)" = \
  "c5d842f75ca7a647a0773b0c30d303d7da21d1d6 f6794b607609c57dc92def696d05946c9c96856a"
test "$(git diff-tree --no-commit-id --name-only -r c5d842f75ca7a647a0773b0c30d303d7da21d1d6)" = \
  "$(printf '%s\n' .codex-handoff/phase-01-p1-r2.json docs/research/hosted-web/phase-1/reviews/list-semantics.md)"
```

Then parse the index, handoff, and review and validate exact counts and acceptance:

```bash
node <<'NODE'
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')

const index = require('./docs/hosted-web-phases/EXECUTION_INDEX.json')
const handoffPath = '.codex-handoff/phase-01-p1-r2.json'
const resultPath = 'docs/research/hosted-web/phase-1/reviews/list-semantics.md'
const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf8'))
const inputGroups = index.phase1CanonicalInputs
const inputs = [
  ...inputGroups.bootstrapPaths,
  ...inputGroups.p11aPaths,
  ...inputGroups.p11aRemediationProvenancePaths,
  ...inputGroups.p11bPaths,
  ...inputGroups.p11cPaths,
  ...inputGroups.p1r1Paths,
  ...inputGroups.p11dPaths,
  ...inputGroups.p1r2Paths,
]
assert.equal(inputs.length, 68)
assert.equal(new Set(inputs).size, 68)
assert(inputs.every((path) => fs.existsSync(path)))
assert.equal(handoff.disposition, 'ACCEPT')
assert.deepEqual(handoff.findingCounts, { P0: 0, P1: 0, P2: 0 })
assert.equal(handoff.evidence.length, 1)
assert.equal(handoff.evidence[0].id, 'P1.R2.SEMANTIC_REVIEW')
assert.equal(handoff.evidence[0].proofLevel, 'target_verified')
const sha = (path) => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')
assert.equal(sha(handoffPath), index.acceptedP1R2.handoffSha256)
assert.equal(sha(resultPath), index.acceptedP1R2.resultSha256)
assert.equal(handoff.resultFileSha256, index.acceptedP1R2.resultSha256)
console.log('P1.I canonical inputs: 68; P1.R2: ACCEPT 0/0/0')
NODE
```

Expand the exact input list from the same machine manifest and prove no input changed between the
accepted evidence integration and the producer authority:

```bash
mapfile -t phase1_input_paths < <(node -e \
  "const i=require('./docs/hosted-web-phases/EXECUTION_INDEX.json').phase1CanonicalInputs; console.log([...i.bootstrapPaths,...i.p11aPaths,...i.p11aRemediationProvenancePaths,...i.p11bPaths,...i.p11cPaths,...i.p1r1Paths,...i.p11dPaths,...i.p1r2Paths].join('\\n'))")
test "${#phase1_input_paths[@]}" -eq 68
git diff --exit-code \
  c5d842f75ca7a647a0773b0c30d303d7da21d1d6 \
  HEAD \
  -- "${phase1_input_paths[@]}"
git diff --exit-code HEAD -- "${phase1_input_paths[@]}"
```

The integration report records a per-file SHA-256 for all 68 inputs and a deterministic manifest
digest over exact `path`, NUL, `sha256`, NUL tuples in manifest order. It must preserve SHA roles
instead of conflating the router base, producer authority, P1.R2 review authority, reviewed-product
snapshot, and P1.S0 bootstrap.

## Full test, typecheck, lint, and quality gates

Run the complete Phase 1 Vitest surface exactly once as this command:

```bash
pnpm exec vitest run test/features/team-lifecycle test/architecture/hosted-web/phase-1
```

It must exit zero with exactly 13/13 files and 59/59 tests. A narrower command cannot close
`P1.GATE.TESTS`.

Run `pnpm typecheck`. It may exit one only for these exact seven inherited diagnostics:

- `test/architecture/hosted-web/phase-0/auth-artifacts/auth-artifacts-spike.test.ts`: TS7016 at
  25:8; TS7031 at 66:31; TS18046 at 117:68; TS7031 at 413:48; TS7031 at 733:10;
- `test/architecture/hosted-web/phase-0/host-primitives/evidence-scanner.test.ts`: TS7016 at 12:8;
  and
- `test/architecture/hosted-web/phase-0/provider-runtime/scan-runtime-surfaces.test.ts`: TS2352 at
  162:44.

Acceptance requires exactly `7 inherited / 0 owned / 0 unexpected`. A removed, moved, changed, or
additional diagnostic fails. The producer must not edit anything to normalize this inherited set.

Run full lint, not the fast substitute:

```bash
pnpm lint
```

It must exit zero. No lint writer or fix command is authorized.

After all five outputs are final, run Prettier over the exact 68 inputs plus five outputs:

```bash
pnpm exec prettier --check "${phase1_input_paths[@]}" \
  .codex-handoff/phase-01-p1-i.json \
  docs/research/hosted-web/phase-1/decision-register.json \
  docs/research/hosted-web/phase-1/estimate-reconciliation.json \
  docs/research/hosted-web/phase-1/evidence-index.json \
  docs/research/hosted-web/phase-1/integration-report.json
```

The matched path count must be exactly 73. Formatting writers are prohibited.

## Rollback and apply proof

The rollback payload is exactly the 54 product, test, fixture, and scanner paths frozen in
`EXECUTION_INDEX.json.rollbackPayload.paths`. Evidence, reviews, bootstrap records, handoffs, and the
five P1.I outputs are not removed by rollback. Every payload path must be absent at the P1.S0
bootstrap SHA and present at the accepted P1.R2 integration SHA.

Create and exercise the patch only in a fresh scratch directory outside the repository. The commands
below must not stage or mutate the producer worktree:

```bash
mapfile -t rollback_payload_paths < <(node -e \
  "const i=require('./docs/hosted-web-phases/EXECUTION_INDEX.json'); console.log(i.rollbackPayload.paths.join('\\n'))")
test "${#rollback_payload_paths[@]}" -eq 54
for path in "${rollback_payload_paths[@]}"; do
  ! git cat-file -e "5f30df49e052d1cc1d0e7efd03aa105673b5b614:$path" 2>/dev/null
  git cat-file -e "c5d842f75ca7a647a0773b0c30d303d7da21d1d6:$path"
done

scratch_root=$(mktemp -d)
rollback_patch="$scratch_root/phase-01-payload.patch"
scratch_tree="$scratch_root/tree"
mkdir "$scratch_tree"
git diff --binary --full-index \
  5f30df49e052d1cc1d0e7efd03aa105673b5b614 \
  c5d842f75ca7a647a0773b0c30d303d7da21d1d6 \
  -- "${rollback_payload_paths[@]}" > "$rollback_patch"
test -s "$rollback_patch"
git apply --check --reverse "$rollback_patch"
git archive 5f30df49e052d1cc1d0e7efd03aa105673b5b614 | tar -x -C "$scratch_tree"
(
  cd "$scratch_tree"
  git apply --check "$rollback_patch"
  git apply "$rollback_patch"
)
node - "$scratch_tree" <<'NODE'
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const cp = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const root = process.argv[2]
const index = require('./docs/hosted-web-phases/EXECUTION_INDEX.json')
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex')
for (const relative of index.rollbackPayload.paths) {
  const expected = cp.execFileSync('git', [
    'show',
    `c5d842f75ca7a647a0773b0c30d303d7da21d1d6:${relative}`,
  ])
  const actual = fs.readFileSync(path.join(root, relative))
  assert.equal(sha(actual), sha(expected), relative)
}
console.log('P1.I scratch forward apply: 54/54 hashes exact')
NODE
(
  cd "$scratch_tree"
  git apply --check --reverse "$rollback_patch"
  git apply --reverse "$rollback_patch"
)
for path in "${rollback_payload_paths[@]}"; do
  test ! -e "$scratch_tree/$path"
done
rm -rf "$scratch_root"
git diff --exit-code HEAD -- "${phase1_input_paths[@]}"
git diff --cached --quiet
```

Record the patch SHA-256, exact path count, forward 54/54 hash comparison, reverse 54/54 absence
proof, scratch cleanup, and unchanged repository state. This scratch-only round trip is verification,
not Git integration. Running `git apply` without `--check` in the repository, changing the index,
checking out another tree, or applying a patch to any real project is forbidden.

## Decision register contract

`decision-register.json` must be valid JSON and contain:

1. schema, phase, lane, packet revision, all distinct authority SHA roles, and terminal `HOLD`;
2. exact dispositions for P1-GAP-001 through P1-GAP-010, with no missing or duplicate ID;
3. every frozen negative-control ID, current exact diagnostic, evidence owner, positive neighbor,
   acceptance/narrowing/deferral disposition, and proof path;
4. explicit accepted P1.R1 and P1.R2 decisions, including P1.R2 0/0/0;
5. explicit acceptance of `P1.NEG.RATCHET_REGRESSION` from both P1.R1 and fresh P1.I evidence;
6. the retained `P1.NEG.TEST_ROOT_ESCAPE` Phase 2 deferral and reopen condition;
7. risk dispositions with no open critical risk and named handling for every high risk;
8. explicit decisions that no production route, IPC/preload/renderer surface, filesystem adapter,
   production authorization, production cursor integrity, real-project verification, or Phase 2
   behavior was proved; and
9. P1.I broker integration blocked until reviewer `ACCEPT` and root `mark_reviewed`, with P1.F,
   Phase 2+, product workers, and successor controllers blocked without exception.

No producer recommendation is silently converted into an accepted decision. A bootstrap proposal
identifier or diagnostic changed by later reviewed narrowing must preserve both the old proposal and
the exact accepted replacement authority.

## Estimate reconciliation contract

`estimate-reconciliation.json` must contain:

1. the eight unique buckets `P1.S0`, `P1.1A`, `P1.1B`, `P1.1C`, `P1.R1`, `P1.1D`, `P1.R2`, and
   `P1.I` exactly once;
2. frozen planned ranges and the S0 actual from `bootstrap/estimate-allocation.json`;
3. exact actual gross changed lines from disjoint owned path sets, including evidence and reviews;
4. one path-to-bucket assignment for every counted path and no duplicate assignment;
5. the exact method, base/result SHAs, commands, and arithmetic used;
6. explicit variance for every bucket and the complete Phase 1 total; and
7. a statement that variance does not broaden scope, reopen the accepted Phase 0 estimate, or
   authorize P1.F.

Do not discard handoffs, reviews, or freeze evidence to force an estimate into range. If historical
revisions touched the same final path more than once, record the chosen final-state gross-line method
and do not count that path in two buckets.

## Evidence index contract

`evidence-index.json` must follow `EVIDENCE_LIFECYCLE.md`. Each row records stable ID, exact path or
paths, phase/lane, producer, producer base SHA, content SHA-256, authority class, proof level,
regeneration command or `null`, review disposition, and reciprocal supersession fields.

At minimum it must account for:

- `P1.S0.BASELINE` and `P1.S0.BOOTSTRAP`;
- `P1.1A.KERNEL`, `P1.1A.VERSION`, `P1.1A.VERSION.REMEDIATION`, and
  `P1.NEG.SCHEMA_VERSION`;
- `P1.1B.ROUTES` and `P1.1B.CAPABILITIES`;
- `P1.1C.CONFORMANCE` and `P1.1C.RATCHETS`;
- `P1.R1.ARCH_REVIEW`;
- the actual accepted P1.1D contract, use-case, and semantic-proof IDs from its integrated handoff;
- `P1.R2.SEMANTIC_REVIEW`;
- every frozen negative-control disposition, including `P1.NEG.RATCHET_REGRESSION`; and
- `P1.I.INTEGRATION` and `P1.I.ROLLBACK`.

Accepted predecessor rows may be `canonical` only when their accepted review authority is recorded.
The P1.I rows remain `generated` with `pending` review disposition in the producer candidate; the
producer must not self-approve them. Supersession is reciprocal, cycle-free, and used only for real
authority transfer. Proposed-but-never-produced identifiers are decisions, not fabricated evidence.

## Integration report contract

`integration-report.json` is the complete gate record. It contains:

1. tool versions and exact authority/provenance roles;
2. all 68 input paths, hashes, group counts, manifest digest, and byte-equality proof;
3. all five output paths and hashes that can be computed without creating a hash cycle;
4. the 14 exact gate records and their commands, exit codes, counts, durations, and classifications;
5. exact P1.R1/P1.R2 review adoption evidence without reintegration;
6. the full 13/59 Vitest result and focused 1/3 ratchet result;
7. the complete seven-diagnostic typecheck classification and full-lint result;
8. Prettier, diff, status, scan, and binary classifications;
9. the exact rollback/apply proof, patch hash, 54-path hashes, and no-worktree-mutation proof;
10. the exact negative matrix and `P1.NEG.RATCHET_REGRESSION` acceptance detail;
11. the decision, estimate, and evidence-index cross-references and hashes; and
12. unverified production claims, blocked successors, next action `independent-verification`, and
    terminal state `HOLD`.

The report must not say that P1.I is independently accepted, integrated, or that Phase 1/P1.F is
authorized. It is a producer candidate awaiting independent verification.

## Handoff contract

`.codex-handoff/phase-01-p1-i.json` follows `PACKET_STANDARD.md` and contains:

1. `schemaVersion: 1`, `phaseId: "phase-01"`, `laneId: "p1-i"`, and packet revision
   `phase-01-p1-i-integration-r1`;
2. `baseSha`, `canonicalSha`, `planBundleCommit`, `phaseStartSha`, and `headSha`, all equal to
   `postIntegrationAuthoritySha`;
3. separate `acceptedP1R2IntegrationSha`, `p1R2ReviewAuthoritySha`,
   `reviewedProductSnapshotSha`, and `phase1BootstrapSha` fields with the exact values above;
4. status `verified` only if all 14 gates pass; otherwise `blocked` or `failed` with exact reasons;
5. exactly two evidence rows, `P1.I.INTEGRATION` and `P1.I.ROLLBACK`, both pointing to
   `integration-report.json` and using `target_verified` only when fully observed;
6. `changedPaths` containing exactly the five outputs in writer-authority order;
7. every command, exit code, count, diagnostic classification, scan classification, path/hash proof,
   estimate result, decision result, and rollback result;
8. SHA-256 for the four non-handoff result files and an explicit non-cyclic hash relationship;
9. no blocker hidden as an inherited pass and no claim of independent acceptance or integration; and
10. `nextAction: "independent-verification"` and `terminalState: "HOLD"`.

## Exact final scope and scans

After all outputs are complete:

```bash
git diff --check
git diff --cached --quiet
git diff --exit-code
git status --short
```

Status must resolve to exactly the five untracked paths in writer-authority order, with no staged or
tracked diff. Scan the exact `phase1_input_paths` plus five outputs with one 73-path array:

```bash
p1i_scan_paths=(
  "${phase1_input_paths[@]}"
  .codex-handoff/phase-01-p1-i.json
  docs/research/hosted-web/phase-1/decision-register.json
  docs/research/hosted-web/phase-1/estimate-reconciliation.json
  docs/research/hosted-web/phase-1/evidence-index.json
  docs/research/hosted-web/phase-1/integration-report.json
)
test "${#p1i_scan_paths[@]}" -eq 73
rg -n -i '(api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|bearer|cookie|authorization)' "${p1i_scan_paths[@]}"
rg -n -i '(provider|anthropic|claude|openai|opencode|gpt-[0-9])' "${p1i_scan_paths[@]}"
rg -n '(/Users/|/home/|/root/|/tmp/|~/|[A-Za-z]:\\Users\\|real[-_ ]project)' "${p1i_scan_paths[@]}"
file --mime-type "${p1i_scan_paths[@]}"
```

Record every exit code and classify every match. Required model/profile metadata, frozen diagnostics,
synthetic negative-control terms, repository-relative paths, and the scan-pattern literals are not
payload values, but they still require explicit classification. A real credential, auth/provider
payload, private user path, real-project path, task-local temporary path value, raw command/runtime
body, or binary output fails the gate. A zero-match claim without all 73 paths is invalid.

## Stop conditions

Stop changing outputs and end `HOLD` on any stale authority, invalid root attestation, P1.R2 evidence
drift, non-ACCEPT predecessor, nonzero P0/P1/P2 predecessor count, input hash drift, missing input,
extra output, staged file, product/test/router edit, dependency or configuration change, required test
or lint failure, typecheck drift, unclassified scan match, unsafe value, rollback mismatch, estimate
duplication, decision omission, evidence-lifecycle violation, or unsupported production claim.

Also stop on any producer attempt to fetch, query GitHub, install dependencies, launch an
app/server/runtime, run an agent flow, access a real project, write a registry, apply a patch in the
repository, stage, commit, merge, push, integrate, launch a reviewer, start P1.F/Phase 2+, replace the
controller, or create a successor controller. A reviewer launch before producer termination or while
any producer/reviewer is active is also a stop. The producer has no repair or retry authority.

## Independent milestone review and accepted-result lifecycle

After the producer returns its strict terminal result and the broker immutably captures all five
output bytes and hashes, root must prove the producer is terminal and no producer or reviewer is
active. Root may then prepare exactly one fresh independent P1.I milestone reviewer with this profile:

```text
operation: codex_goal_project_prepare_verifier
workerRole: reviewer
reviewScope: P1.I-milestone
model: gpt-5.6-sol
reasoningEffort: xhigh
serviceTier: default
sourceRemote: origin
sourceBranch: refactor/hosted-web-feature-boundaries
expectedSourceCommit: <postIntegrationAuthoritySha>
inputPatchHash: <brokerCapturedProducerImmutableOutputHash>
reviewKind: review
```

The reviewer uses `gpt-5.6-sol`; Fast is prohibited. It must be independent of the producer, router
author, and prior Phase 1 producers/reviewers, with freshness and independence attested by root before
start. It is read-only over exactly 73 paths: the 68 paths in
`EXECUTION_INDEX.json.phase1CanonicalInputs`, in manifest order, followed by the five P1.I outputs in
writer-authority order. It has no repository writer, repair, lifecycle, integration, retry, refill,
replacement, network, provider, runtime, agent-flow, registry, or real-project authority.

The reviewer audits provenance, all five output contracts, all 14 recorded gate results, the exact
test/typecheck/lint/format/scope/scan/rollback evidence, negative-control decisions, hashes, and the
terminal `HOLD` boundary. It returns exactly one broker-captured immutable terminal result:

```text
P1_I_REVIEW_RESULT {"disposition":"ACCEPT","findingCounts":{"P0":0,"P1":0,"P2":0},"reviewedInputPathCount":68,"reviewedOutputPathCount":5,"integrationPathCount":5,"terminalState":"HOLD"}
```

A completed review must use exactly `ACCEPT` or `REJECT`. `ACCEPT` requires zero P0/P1/P2 findings
and complete packet conformance. `REJECT` uses the same schema with exact nonzero finding counts and
requires broker-captured immutable finding details for at least one semantic, content, or gate
finding. Admission, provider, environment, or missing-result incidents remain `HOLD` and must not be
synthesized into `REJECT`.

On `ACCEPT`, root mechanically verifies the immutable result and may call `mark_reviewed`. Only after
that action may the broker integrate and push exactly the five P1.I outputs, in writer-authority order.
On `REJECT`, root may not mark reviewed and the broker may not integrate. Neither path authorizes
P1.F, Phase 2+, product work, or a successor controller.

## Strict terminal result and HOLD

Return exactly one compact structured terminal line after immutable output is captured:

```text
P1_I_PRODUCER_RESULT {"status":"VERIFIED","evidenceIds":["P1.I.INTEGRATION","P1.I.ROLLBACK"],"changedPathCount":5,"nextAction":"independent-verification","terminalState":"HOLD"}
```

`VERIFIED` is legal only when every required gate and output contract passes. On a stop condition,
replace only that value with exactly `BLOCKED` or `FAILED` and preserve every other field. The
producer result is not independent acceptance. Completion requires the strict terminal result plus
broker-captured immutable output binding all five result paths; `changedFiles`, heartbeat, PID, tmux,
and `providerObserved` are insufficient.

After producer completion, remain `HOLD` for the one serial milestone reviewer authorized above and,
only after its `ACCEPT` plus root `mark_reviewed`, broker integration of exactly the five P1.I
outputs. P1.F requires a separate reviewed router transition after that integration. P1.F, Phase 2+,
product workers, and successor controllers remain blocked.
