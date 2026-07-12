import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_SHA,
  computeWorkKey,
  validateWorkerStartContract,
} from '../../../../scripts/hosted-web/orchestration/contract-lib.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const templatePath = path.join(
  repoRoot,
  'test/architecture/hosted-web/orchestration/fixtures/valid-worker-start.template.json'
);

function validContract() {
  const template = JSON.parse(
    readFileSync(templatePath, 'utf8')
      .replaceAll('$JOB_ROOT', repoRoot)
      .replaceAll('$PHASE_START_SHA', CANONICAL_SHA)
  );
  template.workKey = computeWorkKey(template);
  return template;
}

function validate(contract, options = {}) {
  return validateWorkerStartContract(contract, { gitHead: CANONICAL_SHA, ...options });
}

test('accepts the exact canonical, sandbox-only worker-start contract', () => {
  const result = validate(validContract());
  assert.deepEqual(result, { ok: true, issues: [] });
});

test('separates canonical provenance from the contract-bound phase start', () => {
  const contract = validContract();
  contract.canonicalSha = '0'.repeat(40);
  contract.baseSha = '1'.repeat(40);
  contract.phaseStartSha = '2'.repeat(40);
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`canonicalSha:expected:${CANONICAL_SHA}`));
  assert.ok(result.issues.includes(`baseSha:expected:${CANONICAL_SHA}`));
  assert.ok(result.issues.includes('workKey:mismatch'));
  assert.ok(result.issues.some((issue) => issue.startsWith('jobRoot:git_head_expected:')));
});

test('rejects missing mandatory inputs and non-exact paths', () => {
  const contract = validContract();
  contract.mandatoryFixtures = ['test/architecture/hosted-web/orchestration/fixtures/missing.json'];
  contract.ownedPaths = ['./docs/hosted-web-phases/*.md'];
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.startsWith('mandatoryFixtures:missing:')));
  assert.ok(result.issues.includes('ownedPaths:invalid_exact_path:./docs/hosted-web-phases/*.md'));
});

test('rejects prompt and sandbox paths outside jobRoot', () => {
  const contract = validContract();
  contract.promptPath = process.execPath;
  contract.executionPolicy.sandboxRoot = path.parse(repoRoot).root;
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('promptPath:outside_jobRoot'));
  assert.ok(result.issues.includes('executionPolicy:sandboxRoot_outside_jobRoot'));
});

test('rejects a weakened sandbox policy or missing forbidden real-project rule', () => {
  const contract = validContract();
  contract.executionPolicy.mode = 'allow-real-projects';
  contract.executionPolicy.forbiddenRealProjects = ['~/somewhere-else'];
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('executionPolicy:mode_must_be_sandbox-only'));
  assert.ok(
    result.issues.includes(
      'executionPolicy:missing_forbidden_project:~/dev/projects/ai/claude-runtime'
    )
  );
});

test('rejects a job rooted in any explicitly forbidden real project', () => {
  const contract = validContract();
  contract.executionPolicy.forbiddenRealProjects.push(repoRoot);
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`jobRoot:forbidden_real_project:${repoRoot}`));
});

test('rejects incomplete mandatory check contracts', () => {
  const contract = validContract();
  contract.requiredChecks = [];
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('requiredChecks:non_empty_array_required'));
});

test('requires both authoritative packet paths as mandatory worker reads', () => {
  const contract = validContract();
  contract.mandatoryDocs = contract.mandatoryDocs.filter(
    (item) => item !== contract.controllerPacket
  );
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(
    result.issues.includes(
      'mandatoryDocs:missing_packet_reference:docs/hosted-web-phase-0-execution-packet.md'
    )
  );
});

test('rejects the blocked Phase 1 proposal as worker authority', () => {
  const contract = validContract();
  contract.phaseId = 'phase-01';
  contract.packetRevision = 'phase-01-r1';
  contract.controllerPacket = 'docs/hosted-web-phases/phase-01/controller-packet.md';
  contract.lanePacket = 'docs/hosted-web-phases/phase-01/packet-inputs.md';
  contract.workKey = computeWorkKey(contract);
  const result = validate(contract);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes('phaseId:not_authorized:phase-01'));
  assert.ok(
    result.issues.includes(
      'controllerPacket:not_authoritative:docs/hosted-web-phases/phase-01/controller-packet.md'
    )
  );
});

function temporaryContractFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'hosted-web-worker-contract-'));
  for (const relativePath of [
    'AGENTS.md',
    'CLAUDE.md',
    'AGENT_CRITICAL_GUARDRAILS.md',
    'docs/hosted-web-phases/START_HERE.md',
    'docs/hosted-web-phases/EVIDENCE_LIFECYCLE.md',
    'docs/hosted-web-phases/ORCHESTRATION_GUARDS.md',
    'docs/hosted-web-phase-0-execution-packet.md',
    'docs/hosted-web-phases/phase-00/lanes/w1-parity-renderer.md',
    'fixtures/prompt.md',
    'fixtures/input.json',
    'fixtures/required-script.mjs',
  ]) {
    const absolutePath = path.join(root, relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, 'fixture\n');
  }
  const contract = validContract();
  contract.jobRoot = root;
  contract.promptPath = path.join(root, 'fixtures/prompt.md');
  contract.mandatoryDocs = [
    ...contract.mandatoryDocs.filter((item) => !item.includes('test/architecture/')),
  ];
  contract.mandatoryScripts = ['fixtures/required-script.mjs'];
  contract.mandatoryFixtures = ['fixtures/input.json'];
  contract.requiredChecks = [{ id: 'fixture', cwd: 'fixtures', command: 'node --test check.mjs' }];
  contract.executionPolicy.sandboxRoot = path.join(root, 'fixtures');
  return { contract, root };
}

test('rejects a symlink whose resolved target is a directory where a file is mandatory', (t) => {
  const { contract, root } = temporaryContractFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'fixtures/script-directory'));
  symlinkSync('script-directory', path.join(root, 'fixtures/script-link'));
  contract.mandatoryScripts = ['fixtures/script-link'];
  const result = validate(contract, { checkGitHead: false });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.startsWith('mandatoryScripts:not_file:')));
});

test('rejects a symlink whose resolved target is a file where a directory is mandatory', (t) => {
  const { contract, root } = temporaryContractFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  symlinkSync('required-script.mjs', path.join(root, 'fixtures/check-cwd-link'));
  contract.requiredChecks[0].cwd = 'fixtures/check-cwd-link';
  const result = validate(contract, { checkGitHead: false });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.startsWith('requiredChecks:cwd:not_directory:')));
});
