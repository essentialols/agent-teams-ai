# Persistence Runbook

## Local Disabled Mode

Default local mode does not require Postgres:

```bash
CONTROL_PLANE_MODE=local-disabled pnpm --dir control-plane worker:smoke
```

`CONTROL_PLANE_PERSISTENCE_ENABLED=false` keeps DB-backed features disabled even
if other optional settings are present.

## DB Enabled Mode

Required secrets/config:

```text
CONTROL_PLANE_DATABASE_URL
CONTROL_PLANE_ENCRYPTION_MASTER_KEY
```

`CONTROL_PLANE_ENCRYPTION_MASTER_KEY` must be base64-encoded 32 bytes.

Run migrations explicitly:

```bash
pnpm --dir control-plane db:migrate
```

Application and worker boot do not auto-run migrations. Deploy migrations as a
separate operator step.

## Readiness

`/health` is liveness. `/ready` is readiness and reports database status without
printing connection strings or secret values.

If DB readiness fails in hosted mode, stop accepting integration traffic before
workers process outbox events.
