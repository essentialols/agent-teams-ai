#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const requireFromFastify = createRequire(require.resolve('fastify/package.json'));
const Ajv = requireFromFastify('ajv');

const indexDir = dirname(fileURLToPath(import.meta.url));
let repoRoot = indexDir;
while (!existsSync(resolve(repoRoot, 'package.json'))) {
  const parent = dirname(repoRoot);
  if (parent === repoRoot) throw new Error('repository root not found');
  repoRoot = parent;
}

const includeControllerExternal = process.argv.includes('--include-controller-external');
const indexFiles = [
  'lane-identity-index.json',
  'review-disposition-index.json',
  'decision-index.json',
  'evidence-index.json',
  'supersession-index.json',
];
const fixtureFiles = ['omission.json', 'stale-hash.json', 'duplicate-id.json'];
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const indexes = new Map(indexFiles.map((name) => [name, readJson(resolve(indexDir, name))]));

const ajv = new Ajv({ allErrors: true, jsonPointers: true });
const validateIndex = ajv.compile(readJson(resolve(indexDir, 'canonical-index.schema.json')));
const validateFixture = ajv.compile(readJson(resolve(indexDir, 'negative-fixture.schema.json')));

class ValidationFailure extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new ValidationFailure(code, message);
};

const assertUnique = (rows, field, collection) => {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row[field])) fail('DUPLICATE_ID', `${collection} repeats ${row[field]}`);
    seen.add(row[field]);
  }
};

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const checkPathHash = ({ path, sha256: expected, scope = 'repository' }) => {
  if (scope === 'controller-external' && !includeControllerExternal) return;
  const absolute = isAbsolute(path) ? path : resolve(repoRoot, path);
  if (!existsSync(absolute)) fail('PATH_MISSING', path);
  const actual = sha256(absolute);
  if (actual !== expected) fail('STALE_HASH', `${path}: expected ${expected}, received ${actual}`);
};

const validateSemantics = (allIndexes) => {
  const laneIndex = allIndexes.get('lane-identity-index.json');
  const reviewIndex = allIndexes.get('review-disposition-index.json');
  const decisionIndex = allIndexes.get('decision-index.json');
  const evidenceIndex = allIndexes.get('evidence-index.json');
  const supersessionIndex = allIndexes.get('supersession-index.json');

  const expectedLanes = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'];
  assertUnique(laneIndex.lanes, 'laneId', 'lanes');
  const actualLanes = laneIndex.lanes.map(({ laneId }) => laneId).sort();
  if (JSON.stringify(actualLanes) !== JSON.stringify(expectedLanes)) {
    fail('MISSING_LANE', `expected ${expectedLanes.join(',')}; received ${actualLanes.join(',')}`);
  }

  const expectedLaneIdentity = {
    w1: {
      producerJobId: 'agent-teams-hosted-web-refactor-phase-00-remediation-w1-v9',
      packetRevision: 'phase-00-r2',
      sourceBaseSha: 'f7d98790eb868714e536f77bd796072ea706911a',
      integratedAtCommit: '89c1358925033d480bcfe3bdfee6c899df556431',
    },
    w2: {
      producerJobId: 'agent-teams-hosted-web-refactor-phase-00-w2-targeted-fix-a1',
      packetRevision: 'phase-00-r2',
      sourceBaseSha: 'c72fd201867b9bcd1ef77d5e0f95ba379adb4fca',
      integratedAtCommit: '0bf8f2d105def1fa34dd8dedfb8d345d720dc35e',
    },
    w3: {
      producerJobId: 'agent-teams-hosted-web-refactor-phase-00-remediation-w3-v1',
      packetRevision: 'phase-00-r2',
      sourceBaseSha: '0e8431b1935c71a2e77bea1384b134ee25c8aa12',
      integratedAtCommit: '7f23e7b628b09e8fbed71c914af5e665f14dab25',
    },
    w4: {
      producerJobId: 'agent-teams-hosted-web-refactor-phase-00-remediation-w4-w6-v7',
      packetRevision: 'phase-00-r3',
      sourceBaseSha: 'f7d98790eb868714e536f77bd796072ea706911a',
      integratedAtCommit: 'c72fd201867b9bcd1ef77d5e0f95ba379adb4fca',
    },
    w5: {
      producerJobId: 'agent-teams-hosted-web-refactor-phase-00-remediation-w5-v3',
      packetRevision: 'phase-00-r2',
      sourceBaseSha: '648bebed68f5a64c984e83b441e14dd7c587c403',
      integratedAtCommit: 'ffaecae3fc70a42df1ac49c65469f84515ea5ed8',
    },
    w6: {
      producerJobId: 'agent-teams-hosted-web-refactor-phase-00-remediation-w4-w6-v7',
      packetRevision: 'phase-00-r3',
      sourceBaseSha: 'f7d98790eb868714e536f77bd796072ea706911a',
      integratedAtCommit: 'c72fd201867b9bcd1ef77d5e0f95ba379adb4fca',
    },
  };

  for (const lane of laneIndex.lanes) {
    if (lane.phaseStartSha !== laneIndex.phaseStartSha) {
      fail('PHASE_START_MISMATCH', `${lane.laneId} does not use the controller phase start`);
    }
    for (const [field, expected] of Object.entries(expectedLaneIdentity[lane.laneId])) {
      if (lane[field] !== expected) {
        fail('LANE_IDENTITY_MISMATCH', `${lane.laneId}.${field} differs from integration history`);
      }
    }
    checkPathHash(lane.handoff);
  }

  const expectedEvidenceById = new Map();
  for (const lane of laneIndex.lanes) {
    const handoff = readJson(resolve(repoRoot, lane.handoff.path));
    for (const row of handoff.evidence) {
      if (expectedEvidenceById.has(row.id)) {
        fail('DUPLICATE_ID', `lane handoffs repeat ${row.id}`);
      }
      expectedEvidenceById.set(row.id, {
        laneId: lane.laneId,
        path: row.path,
        proofLevel: row.proofLevel,
      });
    }
  }

  assertUnique(reviewIndex.reviews, 'reviewId', 'reviews');
  for (const review of reviewIndex.reviews) review.sources.forEach(checkPathHash);

  assertUnique(decisionIndex.decisions, 'decisionId', 'decisions');
  for (const decision of decisionIndex.decisions) {
    for (const path of decision.authorityPaths) {
      if (!existsSync(resolve(repoRoot, path))) fail('PATH_MISSING', path);
    }
  }

  assertUnique(evidenceIndex.evidence, 'evidenceId', 'evidence');
  const indexedEvidenceIds = evidenceIndex.evidence.map(({ evidenceId }) => evidenceId).sort();
  const handoffEvidenceIds = [...expectedEvidenceById.keys()].sort();
  if (JSON.stringify(indexedEvidenceIds) !== JSON.stringify(handoffEvidenceIds)) {
    fail('MISSING_PROVENANCE', 'evidence IDs differ from the six hashed lane handoffs');
  }
  const laneById = new Map(laneIndex.lanes.map((lane) => [lane.laneId, lane]));
  for (const laneId of expectedLanes) {
    if (!evidenceIndex.evidence.some((row) => row.laneId === laneId)) {
      fail('MISSING_LANE', `evidence index omits ${laneId}`);
    }
  }
  for (const row of evidenceIndex.evidence) {
    const handoffRow = expectedEvidenceById.get(row.evidenceId);
    if (
      row.laneId !== handoffRow.laneId ||
      row.path !== handoffRow.path ||
      row.proofLevel !== handoffRow.proofLevel
    ) {
      fail('EVIDENCE_PROVENANCE_MISMATCH', row.evidenceId);
    }
    checkPathHash({ path: row.path, sha256: row.sha256, scope: 'repository' });
    if (row.integratedAtCommit !== laneById.get(row.laneId)?.integratedAtCommit) {
      fail('INTEGRATION_COMMIT_MISMATCH', `${row.evidenceId} disagrees with ${row.laneId}`);
    }
  }

  assertUnique(supersessionIndex.supersessions, 'supersessionId', 'supersessions');
  for (const row of supersessionIndex.supersessions) {
    row.sources.forEach(checkPathHash);
    if (!existsSync(resolve(repoRoot, row.replacementIndex))) {
      fail('PATH_MISSING', row.replacementIndex);
    }
  }

  const w2 = laneById.get('w2');
  if (
    w2.phaseStartSha !== 'a32f509e6d9bd31ba2135940e336729bf90c3d93' ||
    w2.sourceBaseSha !== 'c72fd201867b9bcd1ef77d5e0f95ba379adb4fca'
  ) {
    fail('PHASE_START_MISMATCH', 'W2 phase start/source-base correction is absent');
  }
  const w2Supersession = supersessionIndex.supersessions.find(
    ({ supersessionId }) => supersessionId === 'P0.CURRENT.SUPERSESSION.W2_INCORRECT_PHASE_START'
  );
  if (
    !w2Supersession?.supersededClaims.includes(
      'phaseStartSha=c72fd201867b9bcd1ef77d5e0f95ba379adb4fca'
    )
  ) {
    fail('PHASE_START_MISMATCH', 'W2 historical claim is not explicitly superseded');
  }
  const expectedW2PhaseStartSources = [
    '.codex-handoff/phase-00-w2.json',
    'docs/research/hosted-web/phase-0/provider-runtime/README.md',
    'docs/research/hosted-web/phase-0/provider-runtime/credential-exposure-matrix.json',
    'docs/research/hosted-web/phase-0/provider-runtime/environment-provenance.json',
    'docs/research/hosted-web/phase-0/provider-runtime/estimate-input.json',
    'docs/research/hosted-web/phase-0/provider-runtime/execution-topology.json',
    'docs/research/hosted-web/phase-0/provider-runtime/fake-runtime-fixture-matrix.json',
    'docs/research/hosted-web/phase-0/provider-runtime/runtime-ingress-inventory.json',
    'docs/research/hosted-web/phase-0/provider-runtime/schemas/credential-exposure-matrix.schema.json',
    'docs/research/hosted-web/phase-0/provider-runtime/schemas/environment-provenance.schema.json',
    'docs/research/hosted-web/phase-0/provider-runtime/schemas/estimate-input.schema.json',
    'docs/research/hosted-web/phase-0/provider-runtime/schemas/execution-topology.schema.json',
    'docs/research/hosted-web/phase-0/provider-runtime/schemas/fake-runtime-fixture-matrix.schema.json',
    'docs/research/hosted-web/phase-0/provider-runtime/schemas/runtime-ingress-inventory.schema.json',
  ].sort();
  const actualW2PhaseStartSources = w2Supersession.sources.map(({ path }) => path).sort();
  if (JSON.stringify(actualW2PhaseStartSources) !== JSON.stringify(expectedW2PhaseStartSources)) {
    fail('MISSING_PROVENANCE', 'W2 incorrect phase-start source set is incomplete or excessive');
  }
};

for (const [name, value] of indexes) {
  if (!validateIndex(value)) {
    fail('SCHEMA', `${name}: ${JSON.stringify(validateIndex.errors)}`);
  }
}
validateSemantics(indexes);

const applyMutation = (target, mutation) => {
  if (mutation.type === 'omit-lane') {
    target.lanes = target.lanes.filter(({ laneId }) => laneId !== mutation.laneId);
    return;
  }
  if (mutation.type === 'replace-evidence-hash') {
    const row = target.evidence.find(({ evidenceId }) => evidenceId === mutation.evidenceId);
    if (!row) fail('FIXTURE_INVALID', mutation.evidenceId);
    row.sha256 = mutation.replacementSha256;
    return;
  }
  if (mutation.type === 'duplicate-first-id') {
    target[mutation.collection].push(clone(target[mutation.collection][0]));
    return;
  }
  if (mutation.type === 'omit-supersession-source') {
    const row = target.supersessions.find(
      ({ supersessionId }) => supersessionId === mutation.supersessionId
    );
    if (!row) fail('FIXTURE_INVALID', mutation.supersessionId);
    row.sources = row.sources.filter(({ path }) => path !== mutation.path);
    return;
  }
  fail('FIXTURE_INVALID', mutation.type);
};

for (const fixtureName of fixtureFiles) {
  const fixture = readJson(resolve(indexDir, 'fixtures', fixtureName));
  if (!validateFixture(fixture)) {
    fail('SCHEMA', `${fixtureName}: ${JSON.stringify(validateFixture.errors)}`);
  }
  const mutated = new Map([...indexes].map(([name, value]) => [name, clone(value)]));
  applyMutation(mutated.get(fixture.targetIndex), fixture.mutation);
  let observedCode = 'NO_FAILURE';
  try {
    validateSemantics(mutated);
  } catch (error) {
    if (!(error instanceof ValidationFailure)) throw error;
    observedCode = error.code;
  }
  if (observedCode !== fixture.expectedCode) {
    fail(
      'NEGATIVE_FALSE_GREEN',
      `${fixture.fixtureId}: expected ${fixture.expectedCode}, received ${observedCode}`
    );
  }
}

process.stdout.write(
  `Phase 0 current canonical indexes passed: 5 schemas, ${indexes.get('evidence-index.json').evidence.length} evidence IDs, 3 focused negatives${includeControllerExternal ? ', controller-external hashes checked' : ''}.\n`
);
