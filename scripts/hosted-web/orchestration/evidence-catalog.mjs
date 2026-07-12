import { realpathSync } from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_SHA,
  isContainedBy,
  isNormalizedRelativePath,
  isObject,
  sha256File,
  validateLaneId,
  validatePhaseId,
  validateSha1,
  validateSha256,
} from './contract-lib.mjs';

const AUTHORITIES = new Set([
  'canonical',
  'raw',
  'generated',
  'historical',
  'rejected',
  'superseded',
]);
const DISPOSITIONS = new Set([
  'pending',
  'approved',
  'approved-with-conditions',
  'rejected',
  'superseded',
  'not-required',
]);
const ACCEPTED_DISPOSITIONS = new Set(['approved', 'approved-with-conditions']);
const EVIDENCE_ID = /^[A-Z0-9][A-Z0-9._-]*$/;

function hasDecisionAuthority(entry) {
  return entry.authority === 'canonical' && ACCEPTED_DISPOSITIONS.has(entry.reviewDisposition);
}

function validateEntryShape(entry, index, issues, requireHash) {
  const label = `entries[${index}]`;
  if (!isObject(entry)) {
    issues.push(`${label}:object_required`);
    return;
  }
  const allowed = [
    'id',
    'path',
    'phaseId',
    'laneId',
    'authority',
    'producer',
    'producerBaseSha',
    'sha256',
    'regenerationCommand',
    'reviewDisposition',
    'supersession',
  ];
  const required = requireHash ? allowed : allowed.filter((key) => key !== 'sha256');
  for (const key of Object.keys(entry)) {
    if (!allowed.includes(key)) issues.push(`${label}:unexpected_field:${key}`);
  }
  for (const key of required) {
    if (!(key in entry)) issues.push(`${label}:missing_field:${key}`);
  }
  if (typeof entry.id !== 'string' || !EVIDENCE_ID.test(entry.id))
    issues.push(`${label}:id_invalid`);
  if (!isNormalizedRelativePath(entry.path)) issues.push(`${label}:path_invalid_exact_path`);
  if (!validatePhaseId(entry.phaseId)) issues.push(`${label}:phaseId_invalid`);
  if (!validateLaneId(entry.laneId)) issues.push(`${label}:laneId_invalid`);
  if (!AUTHORITIES.has(entry.authority)) issues.push(`${label}:authority_invalid`);
  if (typeof entry.producer !== 'string' || entry.producer.length === 0)
    issues.push(`${label}:producer_invalid`);
  if (!validateSha1(entry.producerBaseSha)) issues.push(`${label}:producerBaseSha_invalid`);
  if (requireHash && !validateSha256(entry.sha256)) issues.push(`${label}:sha256_invalid`);
  if (
    entry.regenerationCommand !== null &&
    (typeof entry.regenerationCommand !== 'string' ||
      entry.regenerationCommand.length === 0 ||
      entry.regenerationCommand.trim() !== entry.regenerationCommand)
  ) {
    issues.push(`${label}:regenerationCommand_invalid`);
  }
  if (entry.authority === 'generated' && typeof entry.regenerationCommand !== 'string') {
    issues.push(`${label}:generated_requires_regeneration_command`);
  }
  if (!DISPOSITIONS.has(entry.reviewDisposition)) issues.push(`${label}:reviewDisposition_invalid`);
  if (entry.authority === 'canonical' && !ACCEPTED_DISPOSITIONS.has(entry.reviewDisposition)) {
    issues.push(`${label}:canonical_requires_approved_disposition`);
  }
  if (entry.authority === 'rejected' && entry.reviewDisposition !== 'rejected') {
    issues.push(`${label}:rejected_authority_requires_rejected_disposition`);
  }
  if (entry.authority === 'superseded' && entry.reviewDisposition !== 'superseded') {
    issues.push(`${label}:superseded_authority_requires_superseded_disposition`);
  }
  if (!isObject(entry.supersession)) {
    issues.push(`${label}:supersession_object_required`);
    return;
  }
  for (const key of Object.keys(entry.supersession)) {
    if (!['supersedes', 'supersededBy'].includes(key))
      issues.push(`${label}:supersession_unexpected_field:${key}`);
  }
  if (!Array.isArray(entry.supersession.supersedes)) {
    issues.push(`${label}:supersedes_array_required`);
  } else {
    const seen = new Set();
    for (const id of entry.supersession.supersedes) {
      if (typeof id !== 'string' || !EVIDENCE_ID.test(id))
        issues.push(`${label}:supersedes_id_invalid`);
      if (seen.has(id)) issues.push(`${label}:supersedes_duplicate:${id}`);
      seen.add(id);
    }
    if (entry.supersession.supersedes.length > 0 && !hasDecisionAuthority(entry)) {
      issues.push(`${label}:supersedes_requires_canonical_accepted_authority`);
    }
  }
  const supersededBy = entry.supersession.supersededBy;
  if (
    supersededBy !== null &&
    (typeof supersededBy !== 'string' || !EVIDENCE_ID.test(supersededBy))
  ) {
    issues.push(`${label}:supersededBy_invalid`);
  }
  if (entry.authority === 'superseded' && supersededBy === null) {
    issues.push(`${label}:superseded_authority_requires_forward_link`);
  }
  if (entry.authority !== 'superseded' && supersededBy !== null) {
    issues.push(`${label}:forward_link_requires_superseded_authority`);
  }
}

export function validateEvidenceCatalog(catalog, options = {}) {
  const issues = [];
  if (!isObject(catalog)) return { ok: false, issues: ['catalog:object_required'] };
  const requireHash = options.requireHash !== false;
  for (const key of Object.keys(catalog)) {
    if (!['schemaVersion', 'catalogId', 'canonicalSha', 'entries'].includes(key)) {
      issues.push(`catalog:unexpected_field:${key}`);
    }
  }
  if (catalog.schemaVersion !== 1) issues.push('schemaVersion:expected_1');
  if (typeof catalog.catalogId !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/.test(catalog.catalogId)) {
    issues.push('catalogId:invalid');
  }
  if (catalog.canonicalSha !== CANONICAL_SHA) issues.push(`canonicalSha:expected:${CANONICAL_SHA}`);
  if (!Array.isArray(catalog.entries)) {
    issues.push('entries:array_required');
    return { ok: false, issues };
  }
  if (catalog.entries.length === 0) issues.push('entries:non_empty_array_required');

  const ids = new Map();
  const paths = new Set();
  for (const [index, entry] of catalog.entries.entries()) {
    validateEntryShape(entry, index, issues, requireHash);
    if (!isObject(entry)) continue;
    if (ids.has(entry.id)) issues.push(`entries:duplicate_id:${entry.id}`);
    else ids.set(entry.id, entry);
    if (paths.has(entry.path)) issues.push(`entries:duplicate_path:${entry.path}`);
    else paths.add(entry.path);
  }
  const entryIds = catalog.entries.filter(isObject).map(({ id }) => id);
  const sortedEntryIds = [...entryIds].sort((left, right) => left.localeCompare(right));
  if (entryIds.some((id, index) => id !== sortedEntryIds[index])) {
    issues.push('entries:not_sorted_by_id');
  }

  for (const entry of catalog.entries) {
    if (!isObject(entry) || !isObject(entry.supersession)) continue;
    for (const priorId of entry.supersession.supersedes ?? []) {
      const prior = ids.get(priorId);
      if (!prior) {
        issues.push(`supersession:missing_prior:${entry.id}:${priorId}`);
      } else if (prior.supersession?.supersededBy !== entry.id) {
        issues.push(`supersession:non_reciprocal_prior:${entry.id}:${priorId}`);
      }
    }
    if (entry.supersession.supersededBy !== null) {
      const successor = ids.get(entry.supersession.supersededBy);
      if (!successor) {
        issues.push(
          `supersession:missing_successor:${entry.id}:${entry.supersession.supersededBy}`
        );
      } else if (!successor.supersession?.supersedes?.includes(entry.id)) {
        issues.push(`supersession:non_reciprocal_successor:${entry.id}:${successor.id}`);
      } else if (!hasDecisionAuthority(successor)) {
        issues.push(`supersession:successor_lacks_decision_authority:${entry.id}:${successor.id}`);
      }
    }
  }

  for (const entry of catalog.entries) {
    const visited = new Set();
    let current = entry;
    while (current?.supersession?.supersededBy) {
      if (visited.has(current.id)) {
        issues.push(`supersession:cycle:${entry.id}`);
        break;
      }
      visited.add(current.id);
      current = ids.get(current.supersession.supersededBy);
    }
  }

  if (options.repoRoot && requireHash) {
    const repoRoot = realpathSync(path.resolve(options.repoRoot));
    for (const entry of catalog.entries) {
      if (!isObject(entry) || !isNormalizedRelativePath(entry.path)) continue;
      const artifactPath = path.resolve(repoRoot, entry.path);
      try {
        const realArtifactPath = realpathSync(artifactPath);
        if (!isContainedBy(repoRoot, realArtifactPath)) {
          issues.push(`path:symlink_escape:${entry.id}:${entry.path}`);
          continue;
        }
        const actual = sha256File(artifactPath);
        if (entry.sha256 !== actual) issues.push(`hash:mismatch:${entry.id}:${entry.path}`);
      } catch (error) {
        issues.push(`hash:unreadable:${entry.id}:${entry.path}:${error.code ?? error.message}`);
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

export function generateEvidenceCatalog(source, repoRoot) {
  const sourceResult = validateEvidenceCatalog(source, { requireHash: false });
  if (!sourceResult.ok) return { ok: false, issues: sourceResult.issues };
  const entries = [];
  const issues = [];
  for (const entry of source.entries) {
    try {
      entries.push({ ...entry, sha256: sha256File(path.resolve(repoRoot, entry.path)) });
    } catch (error) {
      issues.push(`hash:unreadable:${entry.id}:${entry.path}:${error.code ?? error.message}`);
    }
  }
  if (issues.length > 0) return { ok: false, issues };
  entries.sort((left, right) => left.id.localeCompare(right.id));
  const catalog = {
    schemaVersion: 1,
    catalogId: source.catalogId,
    canonicalSha: source.canonicalSha,
    entries,
  };
  const result = validateEvidenceCatalog(catalog, { repoRoot });
  return result.ok ? { ok: true, catalog, issues: [] } : { ok: false, issues: result.issues };
}
