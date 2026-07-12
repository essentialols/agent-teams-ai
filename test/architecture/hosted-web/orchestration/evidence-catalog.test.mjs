import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  generateEvidenceCatalog,
  validateEvidenceCatalog,
} from '../../../../scripts/hosted-web/orchestration/evidence-catalog.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const source = JSON.parse(
  readFileSync(
    path.join(repoRoot, 'test/architecture/hosted-web/orchestration/fixtures/catalog-source.json'),
    'utf8'
  )
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function generatedCatalog() {
  const result = generateEvidenceCatalog(clone(source), repoRoot);
  assert.equal(result.ok, true, result.issues?.join('\n'));
  return result.catalog;
}

test('generates deterministic sorted hashes and validates reciprocal supersession', () => {
  const first = generatedCatalog();
  const second = generatedCatalog();
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.entries.map(({ id }) => id),
    ['P0.SUPPORT.ORCHESTRATION.CURRENT', 'P0.SUPPORT.ORCHESTRATION.OLD']
  );
  assert.match(first.entries[0].sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(validateEvidenceCatalog(first, { repoRoot }), { ok: true, issues: [] });
});

test('rejects stale hashes', () => {
  const catalog = generatedCatalog();
  catalog.entries[0].sha256 = '0'.repeat(64);
  const result = validateEvidenceCatalog(catalog, { repoRoot });
  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some((issue) =>
      issue.startsWith('hash:mismatch:P0.SUPPORT.ORCHESTRATION.CURRENT:')
    )
  );
});

test('rejects duplicate evidence IDs and paths', () => {
  const catalog = generatedCatalog();
  catalog.entries.push(clone(catalog.entries[0]));
  const result = validateEvidenceCatalog(catalog);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('entries:duplicate_id:P0.SUPPORT.ORCHESTRATION.CURRENT'));
  assert.ok(
    result.issues.includes(
      'entries:duplicate_path:test/architecture/hosted-web/orchestration/fixtures/catalog-current.txt'
    )
  );
});

test('rejects broken supersession chains and authority/disposition drift', () => {
  const catalog = generatedCatalog();
  const old = catalog.entries.find(({ id }) => id === 'P0.SUPPORT.ORCHESTRATION.OLD');
  old.supersession.supersededBy = 'P0.SUPPORT.ORCHESTRATION.MISSING';
  old.reviewDisposition = 'approved';
  const result = validateEvidenceCatalog(catalog);
  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some((issue) =>
      issue.includes('superseded_authority_requires_superseded_disposition')
    )
  );
  assert.ok(
    result.issues.includes(
      'supersession:missing_successor:P0.SUPPORT.ORCHESTRATION.OLD:P0.SUPPORT.ORCHESTRATION.MISSING'
    )
  );
});

test('rejects non-authoritative supersession successors', () => {
  const cases = [
    ['raw', 'not-required'],
    ['rejected', 'rejected'],
    ['generated', 'approved'],
  ];

  for (const [authority, reviewDisposition] of cases) {
    const catalog = generatedCatalog();
    const current = catalog.entries.find(({ id }) => id === 'P0.SUPPORT.ORCHESTRATION.CURRENT');
    current.authority = authority;
    current.reviewDisposition = reviewDisposition;
    if (authority === 'generated') current.regenerationCommand = 'node regenerate-current.mjs';

    const result = validateEvidenceCatalog(catalog);
    assert.equal(result.ok, false, `${authority}/${reviewDisposition}`);
    assert.ok(
      result.issues.includes('entries[0]:supersedes_requires_canonical_accepted_authority'),
      `${authority}/${reviewDisposition}: ${result.issues.join('\n')}`
    );
    assert.ok(
      result.issues.includes(
        'supersession:successor_lacks_decision_authority:P0.SUPPORT.ORCHESTRATION.OLD:P0.SUPPORT.ORCHESTRATION.CURRENT'
      ),
      `${authority}/${reviewDisposition}: ${result.issues.join('\n')}`
    );
  }
});

test('accepts an approved-with-conditions canonical successor', () => {
  const catalog = generatedCatalog();
  catalog.entries[0].reviewDisposition = 'approved-with-conditions';
  assert.deepEqual(validateEvidenceCatalog(catalog), { ok: true, issues: [] });
});

test('rejects supersession cycles deterministically', () => {
  const catalog = generatedCatalog();
  const current = catalog.entries.find(({ id }) => id === 'P0.SUPPORT.ORCHESTRATION.CURRENT');
  const old = catalog.entries.find(({ id }) => id === 'P0.SUPPORT.ORCHESTRATION.OLD');
  current.authority = 'superseded';
  current.reviewDisposition = 'superseded';
  current.supersession.supersededBy = old.id;
  old.supersession.supersedes = [current.id];

  const result = validateEvidenceCatalog(catalog);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('supersession:cycle:P0.SUPPORT.ORCHESTRATION.CURRENT'));
  assert.ok(result.issues.includes('supersession:cycle:P0.SUPPORT.ORCHESTRATION.OLD'));
});

test('requires generated evidence to carry an exact regeneration command', () => {
  const catalog = generatedCatalog();
  const current = catalog.entries[0];
  current.authority = 'generated';
  current.regenerationCommand = null;
  current.reviewDisposition = 'pending';
  const result = validateEvidenceCatalog(catalog);
  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some((issue) => issue.includes('generated_requires_regeneration_command'))
  );
});
