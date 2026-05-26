# ADR-002: Phase 4 Persistence Foundation

## Status

Accepted.

## Decision

Phase 4 uses Postgres as the durable store, Prisma 7 for schema/client
generation, and explicit parameterized SQL for outbox claim/recovery paths.

Runtime code keeps Prisma behind `platform/database` and feature infrastructure
adapters. Feature domain and application layers stay framework-free and do not
import Prisma, Nest, provider SDKs, or platform adapters.

## Guardrails

- `local-disabled` boots without database URL or encryption key.
- hosted modes require database URL and a base64 32-byte encryption master key.
- app boot does not auto-run hosted migrations.
- outbox claims use DB row locks plus `claim_token` fencing.
- external action content is encrypted through envelope encryption and stored by
  reference.
- raw SQL must be parameterized; unsafe raw SQL helpers are blocked by
  architecture checks.

## Consequences

Prisma 7 requires a driver adapter, so `@prisma/adapter-pg` and `pg` live only in
`platform/database`. DB integration tests need a real Postgres URL through
`CONTROL_PLANE_TEST_DATABASE_URL`.
