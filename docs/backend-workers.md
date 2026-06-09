# Backend Workers

Backend services should keep queues and HTTP framework choices outside the
runtime package. The runtime provides worker pools and provider execution; host
apps decide whether to use BullMQ, Nest queues, direct calls, or another queue.

Recommended first deployment shape:

- one persistent volume for `/var/lib/subscription-runtime`;
- one encrypted file key in env;
- one Redis-backed queue;
- N Codex worker slots with prewarm enabled;
- async job API plus optional sync wait endpoint.

Claude Code workers should follow the same backend-worker shape, but require
capacity-aware slot selection before they are used for production scheduling.
See `docs/claude-worker-pool-rfc.md` for the proposed Claude worker pool,
prewarm and limit-rotation design.
