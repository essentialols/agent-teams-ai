# Hosted-web scripts

Hosted-web scripts are evidence producers, validators, and test probes. They are not general-purpose
permission to run agent teams or runtime smoke against a user project. All live behavior must use a
new sandbox/test project or an explicitly test-only existing project.

Existing phase scripts and their outputs are retained as agent evidence. Do not delete, move,
truncate, or rewrite them while organizing newer evidence. Record authority, hashes, regeneration,
review disposition, and supersession in the catalog contract described by
`docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md`.

The `orchestration/` directory contains dependency-free catalog, worker-start, and work-registry
contract gates. See `scripts/hosted-web/orchestration/README.md`. These repository checks do not
replace the separately required durable shared-runtime enforcement.
