# Hosted-web evidence lifecycle

## One catalog, explicit authority

Every catalog row names one stable evidence ID and records its repository-relative path, phase, lane,
authority class, producer, producer base SHA, content SHA-256, regeneration command, review
disposition, and supersession links. A file's directory or modification time never implies authority.
The schema is `docs/hosted-web-phases/evidence-catalog.schema.json`.

A supersession link transfers authority; it is not merely a provenance link. Therefore every row
named by `supersededBy` must itself be `canonical` with an `approved` or
`approved-with-conditions` disposition, and only such a row may carry a non-empty `supersedes`
list. Raw, generated-but-unadopted, historical, rejected, and already-superseded rows cannot receive
authority through a supersession link. The catalog fails closed instead of laundering authority
through one of those classes.

Authority classes are deliberately disjoint:

| Authority    | Meaning                                                             | Current decision authority                                                 | Retention                                                                                                                                                |
| ------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canonical`  | Reviewed artifact adopted by the controller for its evidence ID.    | Yes, unless a later canonical row explicitly supersedes it.                | Retain permanently with its catalog row and hash. Never rewrite in place.                                                                                |
| `raw`        | Immutable observation, capture, log, or source input.               | No; it supports a reviewed conclusion.                                     | Retain unchanged for the lifetime of every derived artifact and the release audit. No automatic deletion.                                                |
| `generated`  | Deterministic derivative reproducible by the recorded command.      | Only if its review disposition separately permits adoption.                | Retain every reviewed or referenced version. Unreferenced rebuilds may be cleaned only by a separately approved retention process, never by these tools. |
| `historical` | Former context retained for traceability but not current authority. | No.                                                                        | Retain permanently. Do not move it merely to express this class; the catalog is authoritative.                                                           |
| `rejected`   | Reviewed candidate explicitly found unsuitable.                     | No. It must not be revived without a new evidence ID or reviewed revision. | Retain permanently with rejection disposition and review evidence.                                                                                       |
| `superseded` | Former authority replaced by the artifact named in `supersededBy`.  | No.                                                                        | Retain permanently with an unbroken forward and reverse supersession link.                                                                               |

`historical` means context aged out of current decision-making. `rejected` means review made an
adverse decision. `superseded` means a named replacement took authority. These terms are not
interchangeable.

## Review dispositions

Every row records one of `pending`, `approved`, `approved-with-conditions`, `rejected`, `superseded`,
or `not-required`. Canonical evidence must be `approved` or `approved-with-conditions`. Rejected and
superseded authority classes require their matching dispositions. A superseded row must name exactly
one forward replacement; the replacement must list the old evidence ID in `supersedes` and must be
canonical with an accepted disposition. Missing targets, non-reciprocal links, cycles, and
non-authoritative targets invalidate the entire catalog.

Raw observations may use `not-required` because review applies to the conclusion drawn from them, not
to whether the bytes were observed. Generated artifacts require a non-empty exact regeneration command.
Other classes use `null` only when regeneration is impossible or inapplicable.

## Catalog generation and validation

The generator takes a metadata source, hashes the referenced files, sorts rows by evidence ID, and
writes deterministic JSON. The source has the catalog shape but omits each row's `sha256`; the
generator is the only authority for those hashes. It never changes an evidence artifact or overwrites
an existing output path:

```text
node scripts/hosted-web/orchestration/generate-evidence-catalog.mjs \
  --source <metadata-source.json> \
  --output <generated-catalog.json> \
  --repo-root <repository-root>
```

Validate a catalog and re-hash every referenced file with:

```text
node scripts/hosted-web/orchestration/validate-evidence-catalog.mjs \
  --catalog <generated-catalog.json> \
  --repo-root <repository-root>
```

Generation fails on missing files, duplicate IDs or paths, invalid authority/disposition combinations,
unsafe paths, malformed SHAs, or broken supersession links. Validation additionally fails on stale
content hashes and a canonical SHA other than
`42ec333848e29e97c41699b9fed73ed199740e3f`.

## Correction and supersession

1. Preserve the old bytes and row.
2. Produce a new artifact at a new exact path and give it a distinct evidence ID.
3. Record its producer, base SHA, hash, regeneration command, and review disposition.
4. After adoption, classify the old row as `superseded`, set its disposition to `superseded`, set
   `supersededBy` to the new ID, and add the old ID to the new row's `supersedes` list.
5. Validate the entire catalog before using the replacement as an input to a packet or worker.

Catalog generation and validation are non-destructive. They never delete, move, truncate, or rewrite
archived evidence.
