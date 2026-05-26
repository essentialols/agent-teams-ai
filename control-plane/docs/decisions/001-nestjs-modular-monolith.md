# ADR-001: NestJS Modular Monolith For Control Plane

## Status

Proposed.

## Context

Agent Teams needs an optional hosted control plane for integrations such as GitHub App, Telegram, future messenger connectors, billing, and possible runtime relay.

The desktop app remains local-first and must not depend on the control plane for normal local usage.

The control plane may grow significantly. Starting with true microservices would add distributed systems complexity before product boundaries and load patterns are proven. A pure custom Fastify-style modulith would be clean, but would require more custom framework glue for dependency injection, lifecycle, guards, worker bootstrap, and future operational conventions.

## Decision

Use a NestJS modular monolith with Clean Architecture inside feature packages.

Physical deployment for v1:

```text
apps/api
apps/worker
```

Logical architecture:

```text
feature-first bounded contexts
plain TypeScript domain/application
ports in application
adapters in infrastructure/interface
NestJS only on the outer layers
```

## NestJS Quarantine

NestJS is allowed in:

```text
apps/*
packages/features/*/src/interface/*
packages/features/*/src/infrastructure/*
packages/platform/*
```

NestJS is forbidden in:

```text
packages/features/*/src/domain/*
packages/features/*/src/application/*
```

## Rationale

Positive:

- familiar framework for future contributors
- mature dependency injection and module system
- good HTTP/controller/guard/lifecycle story
- worker bootstrap can share configuration and providers
- future path to microservice transports remains open
- less custom glue than a pure hand-rolled framework

Negative:

- risk of framework leakage into use cases
- risk of god services
- risk of circular modules and `forwardRef()`
- more boilerplate for pure use cases and factory providers
- Nest decorators can hide dependencies if overused
- request-scoped providers can make pure use cases depend on HTTP context accidentally
- global pipes, guards, and interceptors can hide validation and authorization decisions
- class-based DTOs can drift into domain models

The decision is acceptable only with architecture enforcement.

## Consequences

Required:

- architecture boundary check from first scaffold
- use cases tested without Nest TestingModule
- controllers stay thin
- DTOs do not become domain models
- small ports, not giant services
- outbox-first external side effects
- no `forwardRef()` without explicit ADR
- no request-scoped providers in domain/application composition
- transport auth context is mapped to explicit command/session objects
- global Nest middleware cannot contain business authorization policy

NestJS-specific note:

- request-scoped providers can bubble up the injection chain and affect performance
- domain/application use cases should receive explicit session/command input instead of injecting request context
- dynamic modules are allowed for platform configuration, but feature boundaries must still be enforced by imports and tests

Rejected alternatives:

1. Pure Fastify modulith
   - cleaner and smaller
   - more custom glue
   - less familiar for larger backend contributors

2. True microservices from day one
   - too much distributed complexity too early
   - requires service discovery, tracing, versioned inter-service contracts, deployment orchestration, and distributed failure handling before product boundaries are proven

3. Raw copy of `review-router`
   - useful architecture reference
   - not the right product shape
   - would bring unrelated web/product/spike/deploy material

## Fitness Functions

The architecture is healthy if:

- domain/application can compile without Nest
- use case tests do not bootstrap Nest
- adding Telegram does not modify GitHub domain/application
- adding billing checks does not require GitHub-specific changes
- worker retries are idempotent
- external side effects have audit and dead-letter paths
- app can run desktop-only without control-plane
