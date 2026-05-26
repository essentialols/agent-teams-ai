# Encryption And Retention Policy

## External Action Content

Large or sensitive provider-bound content is stored in
`external_action_contents`, never inline in outbox payloads or audit metadata.

V1 uses envelope encryption:

- AES-256-GCM content encryption with a per-content data key.
- AES-256-GCM data-key wrapping with the configured master key.
- separate nonce/auth tag metadata for content and data-key encryption.
- ciphertext SHA-256 for integrity/reference checks.

Plain hashes of sensitive plaintext are not stored.

## Shredding

Cryptographic shredding clears:

- ciphertext
- encrypted data key
- content nonce/auth tag
- data-key nonce/auth tag

The reference row may remain for operational evidence, but it cannot be
decrypted after shredding.

## Retention

Cleanup execution is disabled by default until retention values are explicitly
configured:

```text
CONTROL_PLANE_COMPLETED_OUTBOX_RETENTION_DAYS
CONTROL_PLANE_DEAD_LETTER_RETENTION_DAYS
CONTROL_PLANE_EXTERNAL_CONTENT_RETENTION_DAYS
```

Dead-letter evidence should be retained longer than completed outbox rows.
