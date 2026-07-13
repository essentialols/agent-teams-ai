# Phase 1 execution entrypoint

Status: **current only for one future serial `P1.S1` schema-version remediation node**. `P1.S2` and
every later subphase remain blocked.

Phase 0 is accepted and frozen at `f4fa24aac9615a4ce10632965a2244a2e11a273e`. That candidate
includes the accepted fail-closed target-image narrowing, final gate, orchestration authority, bounded
navigation contract, and estimate reconciliation. Exact-image construction and admission remain fail
closed and belong to Phase 5; provider canaries, production composition, and terminal-negative
admission remain explicit implementation risks. They do not reopen Phase 0.

`P1.S0` is accepted at `6f1a87daa9a4bfdf5d754347d92f313f28d0f95d`, an ancestor of the
transition base `f12a85af0fddadd06f69a27ef408d26bc27eb3fc`. Its exact six bootstrap evidence
paths are unchanged. The evidence continues to record the historical S0 worker `phaseStartSha`
`5f30df49e052d1cc1d0e7efd03aa105673b5b614`; the transition does not rewrite it.

Integrated P1.S1 commit `da9625e78c0c96699162793a7ebba0657140d937` preserves the useful `P1.1A`
kernel. The authoritative operator-provided independent integration review finding is:

> "Independent integration review formally REJECTED P1.S1 commit da9625e78 only for incomplete
> P1.NEG.SCHEMA_VERSION."

> The router therefore authorizes exactly one future serial producer target: bounded revision/
> schema-version remediation by `P1.1A-schema-version-remediation`. The remediation packet explicitly
> supersedes `phase-01-s1-foundations-r1` as worker-start authority. `P1.S2` and all route/catalog,
> conformance/ratchet, feature-slice, review, integration, and production transport work remain
> blocked.

## Validated worker route

The current route contains exactly these packets, in this order:

1. `docs/hosted-web-phases/phase-01/controller-packet.md`
2. `docs/hosted-web-phases/phase-01/lanes/p1-s1-schema-version-remediation.md`

After both packets, read only the exact files in the subscription-runtime `worker-start-v1`
contract. The documents below remain reference-on-demand; their presence in this directory is not an
unconditional reading queue:

- `docs/hosted-web-phases/phase-01/packet-inputs.md`
- `docs/hosted-web-phases/phase-01/architecture-and-contracts.md`
- `docs/hosted-web-phases/phase-01/execution-dag.md`
- `docs/hosted-web-phases/phase-01/conformance-and-tests.md`
- `docs/hosted-web-phases/phase-01/operations-and-risk.md`
- `docs/hosted-web-phases/phase-01/execution-packet-templates.md`

## Planning result

The proposed first proof is a paginated, read-only `ListTeamLifecycleSummaries` use case. It is chosen
because the legacy `TeamsAPI.list`, IPC `team:list`, HTTP `GET /api/teams`, and browser stub expose the
same visible seam while currently disagreeing on errors and browser support. Phase 1 would prove the
new application seam with in-memory fixtures plus IPC-shaped and HTTP-shaped adapters that live only
inside an isolated conformance test composition. Neither adapter can be imported or registered by a
production composition. Phase 1 would **not** cut the renderer over, add a preload channel, expose an
unauthenticated hosted route, generate
canonical `TeamId` values from names, or replace the legacy list route. Stable identity and production
read rollout remain Phase 2 work. Standalone production composition and exact-image admission remain
Phase 5 work.

The practical boundary is therefore contracts plus conformance, not a disguised lifecycle rewrite:

- a tiny cross-feature contract kernel;
- feature-owned team-lifecycle DTOs, parsers, query, and consumer-owned read port;
- separate route and capability descriptors;
- isolated test/IPC/HTTP conformance adapters that normalize the same application outcomes;
- architecture ratchets that stop a second god API from forming.

Only the exact revision/schema-version implementation, focused test, fixture, and handoff paths named
by the current lane packet are authorized after this docs-only router packet is integrated. No other
product code, test, fixture, production route, registration, adapter, renderer, feature slice,
filesystem access, dependency, configuration, research, docs, or orchestration change is authorized.
This packet production does not launch the remediation worker.

The one-shot remediation node must return its revised version evidence, the exact
`P1.NEG.SCHEMA_VERSION` negative result, patch manifest, and exact check results to the controller.
Passing the lane does not authorize `P1.S2`; independent review, separate integration, and a later
explicit router advance are required.
