#!/usr/bin/env node

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import {
  evaluateHostedArtifactContract,
  evaluateV1TerminalAbsence,
  repoRoot,
  runAbiSmokeProbe,
  scanStandalone,
  STANDALONE_CHARACTERIZATION_PATH,
  STANDALONE_CHARACTERIZATION_RECORD_TYPE,
  validateArtifactAuthorityProjections,
  validateStandaloneCharacterizationProjection,
} from './auth-artifacts-spike.mjs';
import {
  controllerArtifactContractSha256,
  loadControllerArtifactContract,
  validateControllerArtifactProjection,
} from '../w4-w6-contract/controller-artifact-contract.mjs';
import {
  drainEvidenceEnvelopeId,
  drainEvidenceEnvelopeSchemaPath,
  drainEvidenceEnvelopeSchemaSha256,
  validateW4DrainEvidenceProjection,
} from '../w4-w6-contract/drain-evidence-envelope.mjs';

const localRequire = createRequire(import.meta.url);
const requireFromFastify = createRequire(localRequire.resolve('fastify/package.json'));
const Ajv = requireFromFastify('ajv');
const evidenceDir = resolve(repoRoot, 'docs/research/hosted-web/phase-0/auth-artifacts');
const readJson = (path) => JSON.parse(readFileSync(resolve(repoRoot, path), 'utf8'));

const schema = readJson('docs/research/hosted-web/phase-0/auth-artifacts/evidence.schema.json');
const validateEvidence = new Ajv({ allErrors: true, jsonPointers: true }).compile(schema);
for (const file of [
  'evidence.json',
  'estimate-input.json',
  'historical-rejected-candidate-artifact-scan.json',
  'observed-artifact-scan.json',
  'proposed-hosted-artifact-manifest.json',
  'finding-resolution.json',
]) {
  const value = JSON.parse(readFileSync(resolve(evidenceDir, file), 'utf8'));
  if (!validateEvidence(value)) {
    throw new Error(`${file}: ${JSON.stringify(validateEvidence.errors)}`);
  }
}

const controllerSchema = readJson(
  'docs/research/hosted-web/phase-0/w4-w6-contract/controller-artifact-contract.schema.json'
);
const validateController = new Ajv({ allErrors: true }).compile(controllerSchema);
const controller = loadControllerArtifactContract();
if (!validateController(controller)) {
  throw new Error(`controller artifact contract: ${JSON.stringify(validateController.errors)}`);
}

const evidence = readJson('docs/research/hosted-web/phase-0/auth-artifacts/evidence.json');
const estimate = readJson('docs/research/hosted-web/phase-0/auth-artifacts/estimate-input.json');
const expectedIds = [
  'P0.W6.AUTH_TRANSITIONS',
  'P0.W6.PROXY_ORIGIN_THREAT_MATRIX',
  'P0.W6.COOKIE_VERSION_EVIDENCE',
  'P0.W6.ARTIFACT_INVENTORY',
  'P0.W6.ABI_STUB_REPORT',
  'P0.W6.TERMINAL_ABSENCE_REPORT',
  'P0.W6.ESTIMATE',
].sort();
if (JSON.stringify(evidence.evidence.map(({ id }) => id).sort()) !== JSON.stringify(expectedIds)) {
  throw new Error('W6 evidence IDs differ');
}
if (evidence.packetRevision !== 'phase-00-r3') throw new Error('W6 evidence is not r3');
for (const row of evidence.evidence) {
  if (
    row.owner !== 'w6' ||
    !row.requirementIds?.length ||
    !row.assertions?.length ||
    !row.reproduction?.length
  ) {
    throw new Error(`${row.id}: incomplete evidence shape`);
  }
}

const nativeProtocolSchema = readJson(
  'docs/research/hosted-web/phase-0/host-primitives/native-protocol.schema.json'
);
const processAnchorProtocol = readJson(
  'docs/research/hosted-web/phase-0/host-primitives/process-anchor.protocol.json'
);
const drainProjection = validateW4DrainEvidenceProjection(
  nativeProtocolSchema,
  processAnchorProtocol
);
if (!drainProjection.ok) {
  throw new Error(
    `controller drain-envelope projection drift: ${drainProjection.violations.join(',')}`
  );
}

const w4Projection = readJson(
  'docs/research/hosted-web/phase-0/host-primitives/native-artifact-contract.json'
);
const w6Projection = readJson(
  'docs/research/hosted-web/phase-0/auth-artifacts/proposed-hosted-artifact-manifest.json'
);
const controllerHash = controllerArtifactContractSha256();
for (const [lane, projection] of [
  ['w4', w4Projection],
  ['w6', w6Projection],
]) {
  const result = validateControllerArtifactProjection(controller, projection);
  if (!result.ok) throw new Error(`${lane} projection drift: ${result.violations.join(',')}`);
}
if (JSON.stringify(w4Projection.artifacts) !== JSON.stringify(w6Projection.artifacts)) {
  throw new Error('W4/W6 artifact projections are not equal');
}
const artifactGate = evaluateHostedArtifactContract(w6Projection);
if (!artifactGate.contractPasses || artifactGate.releasePasses || artifactGate.hostedV1Admitted) {
  throw new Error(`r3 artifact disposition mismatch: ${JSON.stringify(artifactGate)}`);
}

const committedScan = readJson(
  'docs/research/hosted-web/phase-0/auth-artifacts/observed-artifact-scan.json'
);
const targetedBuildRoot = mkdtempSync(resolve(tmpdir(), 'w6-current-standalone-build-'));
const targetedBuildEnv = { ...process.env };
delete targetedBuildEnv.AGENT_TEAMS_DISABLE_SOURCEMAPS;
try {
  const targetedBuild = spawnSync(
    process.execPath,
    [
      resolve(repoRoot, 'node_modules/vite/bin/vite.js'),
      'build',
      '--config',
      'docker/vite.standalone.config.ts',
      '--outDir',
      targetedBuildRoot,
      '--emptyOutDir',
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: targetedBuildEnv,
    }
  );
  if (targetedBuild.status !== 0) {
    throw new Error(
      `targeted standalone build failed (${targetedBuild.status}): ${targetedBuild.stderr || targetedBuild.stdout}`
    );
  }
  const targetedBuildScanWithoutTerminal = scanStandalone(repoRoot, {
    buildRoot: targetedBuildRoot,
  });
  const targetedBuildScan = {
    ...targetedBuildScanWithoutTerminal,
    terminalAbsence: evaluateV1TerminalAbsence(targetedBuildScanWithoutTerminal),
  };
  if (!isDeepStrictEqual(committedScan, targetedBuildScan)) {
    const differingFields = Object.keys(committedScan).filter(
      (field) => !isDeepStrictEqual(committedScan[field], targetedBuildScan[field])
    );
    throw new Error(
      `current-commit standalone characterization differs from targeted current build: ${differingFields.join(',')}`
    );
  }
} finally {
  rmSync(targetedBuildRoot, { recursive: true, force: true });
}
const sourceScan = scanStandalone(repoRoot);
if (JSON.stringify(committedScan.source) !== JSON.stringify(sourceScan.source)) {
  throw new Error('standalone source characterization is stale');
}
if (sourceScan.emitted.observed || sourceScan.emitted.files.length !== 0) {
  throw new Error('source characterization consulted mutable ambient standalone output');
}
const standaloneProjection = validateStandaloneCharacterizationProjection(
  committedScan,
  w6Projection.currentStandalone
);
if (!standaloneProjection.ok) {
  throw new Error(
    `standalone characterization drift: ${standaloneProjection.violations.join(',')}`
  );
}
const inventoryEvidence = evidence.evidence.find(({ id }) => id === 'P0.W6.ARTIFACT_INVENTORY');
if (
  JSON.stringify(inventoryEvidence?.facts?.characterizationAuthority) !==
  JSON.stringify(standaloneProjection.expected)
) {
  throw new Error('W6 artifact evidence disagrees with standalone characterization authority');
}
if (
  committedScan.emitted.observed !== true ||
  committedScan.emitted.files.length === 0 ||
  committedScan.emitted.internalStorageWorkerPresent !== false ||
  committedScan.emitted.electronEmptyStubPresent !== true ||
  committedScan.emitted.terminalServiceMarkerPresent !== true
) {
  throw new Error('committed targeted standalone-build characterization is incomplete');
}
if (evaluateV1TerminalAbsence(committedScan).passes) {
  throw new Error('current standalone unexpectedly satisfies the terminal-absence rule');
}

const abiProbe = runAbiSmokeProbe();
if (
  abiProbe.runtime.nodeModuleAbi !== 137 ||
  abiProbe.runtime.electronModuleAbi !== 143 ||
  abiProbe.sqlite.some(({ packageName, reopenedValue }) => packageName !== reopenedValue)
) {
  throw new Error(`ABI characterization mismatch: ${JSON.stringify(abiProbe)}`);
}

const handoff = readJson('.codex-handoff/phase-00-freeze-fix-w6-artifact-f16.json');
if (
  handoff.schemaVersion !== 1 ||
  handoff.taskId !== 'phase-00-freeze-fix-w6-artifact-f16' ||
  handoff.canonicalSourceCommit !== '0d1a82fe2fb0c8d73b62cd3b5996b853bef2d7c3' ||
  handoff.status !== 'remediation_complete_pending_review' ||
  handoff.currentCommitAuthority?.path !== STANDALONE_CHARACTERIZATION_PATH ||
  handoff.currentCommitAuthority?.recordType !== STANDALONE_CHARACTERIZATION_RECORD_TYPE ||
  handoff.currentCommitAuthority?.semanticSha256 !==
    standaloneProjection.expected.authoritySha256 ||
  handoff.currentCommitAuthority?.proofLevel !== 'targeted_current_commit_build_observed' ||
  handoff.currentCommitAuthority?.targetedBuildCompared !== true ||
  handoff.historicalProvenance?.relationship !== 'historical_only_not_current_commit_authority' ||
  handoff.drainEnvelopeConsumer?.envelopeId !== drainEvidenceEnvelopeId ||
  handoff.drainEnvelopeConsumer?.schemaPath !== drainEvidenceEnvelopeSchemaPath ||
  handoff.drainEnvelopeConsumer?.schemaSha256 !== drainEvidenceEnvelopeSchemaSha256() ||
  handoff.drainEnvelopeConsumer?.authority !== 'phase-00-controller' ||
  handoff.drainEnvelopeConsumer?.projection !== 'exact_required_fields_no_lane_owned_wrapper' ||
  handoff.findings?.some(({ status }) => status !== 'resolved') ||
  handoff.findings?.length !== 5
) {
  throw new Error('W6 current-commit artifact authority handoff is stale');
}
const authorityProjection = validateArtifactAuthorityProjections(
  evidence.artifactAuthority,
  evidence,
  estimate,
  handoff
);
if (!authorityProjection.ok) {
  throw new Error(
    `W6 artifact-authority projection drift: ${authorityProjection.violations.join(',')}`
  );
}
if (
  Object.values(handoff.scope).some((value) => value !== false && typeof value === 'boolean') ||
  handoff.scope.disposition !== 'standalone_artifact_rejected_for_hosted_v1'
) {
  throw new Error('W6 artifact-authority handoff overstates admission');
}

const checkedPaths = [
  '.codex-handoff/phase-00-freeze-fix-w6-artifact-f16.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/estimate-input.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/evidence.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/evidence.schema.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/finding-resolution.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/historical-rejected-candidate-artifact-scan.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/observed-artifact-scan.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/proposed-hosted-artifact-manifest.json',
  'docs/research/hosted-web/phase-0/auth-artifacts/report.md',
  'docs/research/hosted-web/phase-0/w4-w6-contract/controller-artifact-contract.json',
  'docs/research/hosted-web/phase-0/w4-w6-contract/controller-artifact-contract.schema.json',
  'scripts/hosted-web/phase-0/auth-artifacts/auth-artifacts-spike.mjs',
  'scripts/hosted-web/phase-0/auth-artifacts/verify-evidence.mjs',
  'scripts/hosted-web/phase-0/w4-w6-contract/controller-artifact-contract.mjs',
  'scripts/hosted-web/phase-0/w4-w6-contract/drain-evidence-envelope.mjs',
  'test/architecture/hosted-web/phase-0/auth-artifacts/auth-artifacts-spike.test.ts',
  'test/architecture/hosted-web/phase-0/w4-w6-contract/artifact-contract.test.ts',
];
const serialized = checkedPaths
  .map((path) => readFileSync(resolve(repoRoot, path), 'utf8'))
  .join('\n');
for (const pattern of [
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._~-]+/,
  /\b(?:sk|ghp)_[A-Za-z0-9]{12,}/,
  /\/(?:Users|home)\/[A-Za-z0-9._-]+\//,
]) {
  if (pattern.test(serialized)) throw new Error(`sensitive-looking value matched ${pattern}`);
}

process.stdout.write(
  `W6 r3 evidence, controller drain envelope, exact artifact-authority projections, reset admission, exact current-commit targeted standalone rejection, terminal rule, ABI characterization and split historical provenance passed (controller ${controllerHash})\n`
);
