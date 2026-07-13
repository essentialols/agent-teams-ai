# Phase 1 execution DAG and ownership

Status: P1.S0, P1.S1, and P1.S2 are accepted and integrated. P1.R1 is the sole current review node
after its router-integration and live-controller gate. P1.1D and later nodes are blocked.

## Current DAG

```text
P1.S0 accepted
  -> P1.S1 / P1.1A accepted + integrated at 041b5c7c2
       -> P1.S2 / P1.1B routes accepted at 74038b54e ------+
       -> P1.S2 / P1.1C conformance accepted at 6a9e9ab71 -+
                                                             -> P1.R1 formal review (current)
                                                                  -X-> P1.1D
                                                                        -> P1.R2
                                                                          -> P1.I
                                                                            -> P1.F
                                                                              -> Phase 2+
```

The admission review of byte-identical combined input `02a6b3ac5` authorizes the transition into
P1.R1 but is not P1.R1 itself. `-X->` remains blocked even if the formal reviewer returns `ACCEPT`;
the accepted review must first be integrated and a later router must separately advance P1.1D.

## Current lane registry

| Node    | Mission                                                                        | Dependency                           | Output                                                        | Packet                  |
| ------- | ------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------- | ----------------------- |
| `P1.R1` | Independently review canonical routes, capabilities, conformance, and ratchets | accepted canonical P1.S2 `6a9e9ab71` | `docs/research/hosted-web/phase-1/reviews/routes-ratchets.md` | `lanes/p1-r1-review.md` |

Capacity is zero until the seven-path router commit is integrated and its successor controller is
`live=true`. Afterward it is exactly one reviewer. The reviewer must be distinct from both P1.S2
producers and admission reviewer `agent-teams-hosted-web-refactor-p1-s2-admission-review-v15-r2`.
There is no retry, refill, producer, repair, integration, or later-node capacity.

## Canonical input projection

Canonical `6a9e9ab714359638fb93a6880855a53c9e8ef4be` contains the two disjoint accepted producer sets:

- P1.1B: 9 paths, evidence IDs `P1.1B.ROUTES` and `P1.1B.CAPABILITIES`, accepted producer commit
  `74038b54eee23e93798b3aa5d11411d3f7e9adcf`;
- P1.1C: 28 paths, evidence IDs `P1.1C.CONFORMANCE` and `P1.1C.RATCHETS`, accepted producer and
  canonical commit `6a9e9ab714359638fb93a6880855a53c9e8ef4be`.

The exact 37-path list and all required gates are frozen in the current review packet. Combined
admission input `02a6b3ac5ac2baaad55c413f8547252dddee4d41` and canonical P1.S2 have identical tree
`22020029327465ed389cd4479db340082ae81601`.

## Exact exclusive writer set

P1.R1 owns exactly:

- `docs/research/hosted-web/phase-1/reviews/routes-ratchets.md`

Every other path is read-only. In particular, the 37 canonical input paths, both handoffs, product
source, tests, fixtures, scripts, package/lock/config files, router docs, existing research evidence,
and all P1.1D+ paths cannot be edited. A finding produces `REJECT`; it never grants repair authority.

## Handoff and blocked successor

The reviewer writes its formal result only to the owned review path, with exact provenance,
independence, commands, exit codes, negative diagnostics, scope proof, findings, and one disposition:
`ACCEPT` or `REJECT`. It must not create a second handoff or evidence file.

Neither result launches or integrates anything. P1.1D, P1.R2, integration/P1.I, P1.F, and Phase 2+
remain blocked until a formal P1.R1 `ACCEPT` is integrated and a separate later router explicitly
authorizes the next node through its own router-integration and successor-controller-live gate.
