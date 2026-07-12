import {
  CANONICAL_SHA,
  computeWorkKey,
  isObject,
  validateWorkerStartContract,
  validateLaneId,
  validatePhaseId,
  validateSha256,
} from './contract-lib.mjs';

export const IN_FLIGHT_STATUSES = Object.freeze(['queued', 'running', 'reviewing']);
export const LAUNCHABLE_STATUS = 'queued';
export const TERMINAL_STATUSES = Object.freeze([
  'verified',
  'characterized',
  'blocked',
  'failed',
  'rejected',
  'superseded',
]);
const ALL_STATUSES = new Set([...IN_FLIGHT_STATUSES, ...TERMINAL_STATUSES]);
const REFILLABLE_STATUSES = new Set(['blocked', 'failed']);
const REVIEW_KINDS = new Set(['implementation', 'review', 'remediation']);

function validateRecordShape(record, index, issues) {
  const label = `records[${index}]`;
  if (!isObject(record)) {
    issues.push(`${label}:object_required`);
    return;
  }
  const fields = [
    'workKey',
    'jobId',
    'workerId',
    'phaseId',
    'laneId',
    'baseSha',
    'phaseStartSha',
    'packetRevision',
    'controllerPacket',
    'lanePacket',
    'inputPatchHash',
    'reviewKind',
    'revision',
    'retryCount',
    'status',
    'supersedes',
    'supersededBy',
    'supersededFrom',
  ];
  for (const key of Object.keys(record)) {
    if (!fields.includes(key)) issues.push(`${label}:unexpected_field:${key}`);
  }
  for (const key of fields) {
    if (!(key in record)) issues.push(`${label}:missing_field:${key}`);
  }
  if (!validateSha256(record.workKey)) issues.push(`${label}:workKey_invalid`);
  if (typeof record.jobId !== 'string' || record.jobId.length === 0)
    issues.push(`${label}:jobId_invalid`);
  if (typeof record.workerId !== 'string' || record.workerId.length === 0)
    issues.push(`${label}:workerId_invalid`);
  if (!validatePhaseId(record.phaseId)) issues.push(`${label}:phaseId_invalid`);
  if (!validateLaneId(record.laneId)) issues.push(`${label}:laneId_invalid`);
  if (record.baseSha !== CANONICAL_SHA) issues.push(`${label}:baseSha_expected:${CANONICAL_SHA}`);
  if (typeof record.phaseStartSha !== 'string' || !/^[0-9a-f]{40}$/.test(record.phaseStartSha))
    issues.push(`${label}:phaseStartSha_invalid`);
  for (const field of ['packetRevision', 'controllerPacket', 'lanePacket']) {
    if (typeof record[field] !== 'string' || record[field].length === 0)
      issues.push(`${label}:${field}_invalid`);
  }
  if (!validateSha256(record.inputPatchHash)) issues.push(`${label}:inputPatchHash_invalid`);
  if (!REVIEW_KINDS.has(record.reviewKind)) issues.push(`${label}:reviewKind_invalid`);
  if (!Number.isInteger(record.revision) || record.revision < 0)
    issues.push(`${label}:revision_invalid`);
  if (!Number.isInteger(record.retryCount) || record.retryCount < 0)
    issues.push(`${label}:retryCount_invalid`);
  if (!ALL_STATUSES.has(record.status)) issues.push(`${label}:status_invalid`);
  if (record.supersedes !== null && !validateSha256(record.supersedes))
    issues.push(`${label}:supersedes_invalid`);
  if (record.supersededBy !== null && !validateSha256(record.supersededBy))
    issues.push(`${label}:supersededBy_invalid`);
  if (validateSha256(record.workKey) && record.workKey !== computeWorkKey(record)) {
    issues.push(`${label}:workKey_mismatch`);
  }
  if (record.revision === 0 && (record.retryCount !== 0 || record.supersedes !== null)) {
    issues.push(`${label}:initial_work_retry_or_supersession_forbidden`);
  }
  if (record.revision > 0 && (record.retryCount < 1 || record.supersedes === null)) {
    issues.push(`${label}:refill_retry_and_supersession_required`);
  }
  if (record.status === 'superseded' && record.supersededBy === null) {
    issues.push(`${label}:superseded_status_requires_successor`);
  }
  if (record.status !== 'superseded' && record.supersededBy !== null) {
    issues.push(`${label}:successor_requires_superseded_status`);
  }
  if (record.status === 'superseded' && !REFILLABLE_STATUSES.has(record.supersededFrom)) {
    issues.push(`${label}:superseded_status_requires_refillable_prior_status`);
  }
  if (record.status !== 'superseded' && record.supersededFrom !== null) {
    issues.push(`${label}:supersededFrom_requires_superseded_status`);
  }
}

function sameRefillIdentity(left, right) {
  return (
    left.jobId === right.jobId &&
    left.workerId === right.workerId &&
    left.phaseId === right.phaseId &&
    left.laneId === right.laneId &&
    left.baseSha === right.baseSha &&
    left.phaseStartSha === right.phaseStartSha &&
    left.packetRevision === right.packetRevision &&
    left.controllerPacket === right.controllerPacket &&
    left.lanePacket === right.lanePacket &&
    left.inputPatchHash === right.inputPatchHash &&
    left.reviewKind === right.reviewKind
  );
}

export function validateOrchestrationState(state) {
  const issues = [];
  if (!isObject(state)) return { ok: false, issues: ['state:object_required'] };
  for (const key of Object.keys(state)) {
    if (!['schemaVersion', 'maxRetries', 'maxInFlight', 'records'].includes(key))
      issues.push(`state:unexpected_field:${key}`);
  }
  if (state.schemaVersion !== 1) issues.push('schemaVersion:expected_1');
  if (!Number.isInteger(state.maxRetries) || state.maxRetries < 0)
    issues.push('maxRetries:non_negative_integer_required');
  if (!Number.isInteger(state.maxInFlight) || state.maxInFlight < 1)
    issues.push('maxInFlight:positive_integer_required');
  if (!Array.isArray(state.records)) {
    issues.push('records:array_required');
    return { ok: false, issues };
  }

  const byKey = new Map();
  for (const [index, record] of state.records.entries()) {
    validateRecordShape(record, index, issues);
    if (!isObject(record)) continue;
    if (byKey.has(record.workKey)) {
      const first = byKey.get(record.workKey);
      issues.push(
        `duplicate_workKey:${record.workKey}:${first.status}:${record.status}:in_flight_or_terminal_rejected`
      );
    } else {
      byKey.set(record.workKey, record);
    }
    if (Number.isInteger(state.maxRetries) && record.retryCount > state.maxRetries) {
      issues.push(
        `max_retries_exceeded:${record.workKey}:${record.retryCount}:${state.maxRetries}`
      );
    }
  }
  const inFlightCount = state.records.filter(
    (record) => isObject(record) && IN_FLIGHT_STATUSES.includes(record.status)
  ).length;
  if (Number.isInteger(state.maxInFlight) && inFlightCount > state.maxInFlight) {
    issues.push(`capacity:in_flight_exceeds_limit:${inFlightCount}:${state.maxInFlight}`);
  }

  for (const record of state.records) {
    if (!isObject(record)) continue;
    if (record.supersedes !== null) {
      const predecessor = byKey.get(record.supersedes);
      if (!predecessor) {
        issues.push(`supersession:missing_predecessor:${record.workKey}:${record.supersedes}`);
      } else {
        if (predecessor.supersededBy !== record.workKey || predecessor.status !== 'superseded') {
          issues.push(
            `supersession:predecessor_not_reciprocal:${record.workKey}:${predecessor.workKey}`
          );
        }
        if (!sameRefillIdentity(predecessor, record)) {
          issues.push(`supersession:identity_changed:${record.workKey}:${predecessor.workKey}`);
        }
        if (record.revision !== predecessor.revision + 1) {
          issues.push(`supersession:revision_not_incremented:${record.workKey}`);
        }
        if (record.retryCount !== predecessor.retryCount + 1) {
          issues.push(`supersession:retry_not_incremented:${record.workKey}`);
        }
      }
    }
    if (record.supersededBy !== null) {
      const successor = byKey.get(record.supersededBy);
      if (!successor) {
        issues.push(`supersession:missing_successor:${record.workKey}:${record.supersededBy}`);
      } else if (successor.supersedes !== record.workKey) {
        issues.push(`supersession:successor_not_reciprocal:${record.workKey}:${successor.workKey}`);
      }
    }
  }

  for (const record of state.records) {
    if (!isObject(record)) continue;
    const visited = new Set();
    let current = record;
    while (current?.supersededBy) {
      if (visited.has(current.workKey)) {
        issues.push(`supersession:cycle:${record.workKey}`);
        break;
      }
      visited.add(current.workKey);
      current = byKey.get(current.supersededBy);
    }
  }

  return { ok: issues.length === 0, issues };
}

export function createInitialState(maxRetries = 2, maxInFlight = 1) {
  if (!Number.isInteger(maxRetries) || maxRetries < 0)
    throw new Error('maxRetries must be a non-negative integer');
  if (!Number.isInteger(maxInFlight) || maxInFlight < 1)
    throw new Error('maxInFlight must be a positive integer');
  return { schemaVersion: 1, maxRetries, maxInFlight, records: [] };
}

export function admitInitialWork(state, request) {
  const stateResult = validateOrchestrationState(state);
  if (!stateResult.ok)
    throw new Error(`invalid orchestration state: ${stateResult.issues.join(', ')}`);
  const record = {
    ...request,
    revision: 0,
    retryCount: 0,
    status: 'queued',
    supersedes: null,
    supersededBy: null,
    supersededFrom: null,
  };
  record.workKey = computeWorkKey(record);
  if (state.records.some(({ workKey }) => workKey === record.workKey)) {
    throw new Error(`duplicate workKey rejected: ${record.workKey}`);
  }
  const inFlightCount = state.records.filter(({ status }) =>
    IN_FLIGHT_STATUSES.includes(status)
  ).length;
  if (inFlightCount >= state.maxInFlight) {
    throw new Error(`capacity exhausted: ${inFlightCount}/${state.maxInFlight}`);
  }
  const candidate = { ...state, records: [...state.records, record] };
  const candidateResult = validateOrchestrationState(candidate);
  if (!candidateResult.ok)
    throw new Error(`work admission rejected: ${candidateResult.issues.join(', ')}`);
  return candidate;
}

export function applyAtomicRefill(state, predecessorWorkKey) {
  const stateResult = validateOrchestrationState(state);
  if (!stateResult.ok)
    throw new Error(`invalid orchestration state: ${stateResult.issues.join(', ')}`);
  const predecessor = state.records.find(({ workKey }) => workKey === predecessorWorkKey);
  if (!predecessor) throw new Error(`refill predecessor missing: ${predecessorWorkKey}`);
  if (!REFILLABLE_STATUSES.has(predecessor.status)) {
    throw new Error(`refill predecessor is not failed or blocked: ${predecessor.status}`);
  }
  if (predecessor.supersededBy !== null)
    throw new Error(`refill predecessor already has successor: ${predecessorWorkKey}`);
  if (predecessor.retryCount >= state.maxRetries) {
    throw new Error(`max retries reached: ${predecessor.retryCount}/${state.maxRetries}`);
  }
  const inFlightCount = state.records.filter(({ status }) =>
    IN_FLIGHT_STATUSES.includes(status)
  ).length;
  if (inFlightCount >= state.maxInFlight) {
    throw new Error(`refill capacity exhausted: ${inFlightCount}/${state.maxInFlight}`);
  }

  const replacement = {
    jobId: predecessor.jobId,
    workerId: predecessor.workerId,
    phaseId: predecessor.phaseId,
    laneId: predecessor.laneId,
    baseSha: predecessor.baseSha,
    phaseStartSha: predecessor.phaseStartSha,
    packetRevision: predecessor.packetRevision,
    controllerPacket: predecessor.controllerPacket,
    lanePacket: predecessor.lanePacket,
    inputPatchHash: predecessor.inputPatchHash,
    reviewKind: predecessor.reviewKind,
    revision: predecessor.revision + 1,
    retryCount: predecessor.retryCount + 1,
    status: 'queued',
    supersedes: predecessor.workKey,
    supersededBy: null,
    supersededFrom: null,
  };
  replacement.workKey = computeWorkKey(replacement);
  if (state.records.some(({ workKey }) => workKey === replacement.workKey)) {
    throw new Error(`duplicate replacement workKey rejected: ${replacement.workKey}`);
  }

  const records = state.records.map((record) =>
    record.workKey === predecessor.workKey
      ? {
          ...record,
          status: 'superseded',
          supersededBy: replacement.workKey,
          supersededFrom: record.status,
        }
      : { ...record }
  );
  records.push(replacement);
  const candidate = { ...state, records };
  const candidateResult = validateOrchestrationState(candidate);
  if (!candidateResult.ok)
    throw new Error(`atomic refill rejected: ${candidateResult.issues.join(', ')}`);
  return candidate;
}

const ADMISSION_IDENTITY_FIELDS = Object.freeze([
  'jobId',
  'workerId',
  'phaseId',
  'laneId',
  'baseSha',
  'phaseStartSha',
  'packetRevision',
  'controllerPacket',
  'lanePacket',
  'inputPatchHash',
  'reviewKind',
  'revision',
  'retryCount',
  'supersedes',
]);

export function validateWorkerAdmission(contract, state, options = {}) {
  const issues = [];
  const contractResult = validateWorkerStartContract(contract, options);
  issues.push(...contractResult.issues.map((issue) => `contract:${issue}`));
  const stateResult = validateOrchestrationState(state);
  issues.push(...stateResult.issues.map((issue) => `state:${issue}`));
  if (!isObject(contract) || !Array.isArray(state?.records)) return { ok: false, issues };

  const matches = state.records.filter((record) => record?.workKey === contract.workKey);
  if (matches.length !== 1) {
    issues.push(`admission:workKey_match_count_expected_1:actual:${matches.length}`);
    return { ok: false, issues };
  }
  const record = matches[0];
  for (const field of ADMISSION_IDENTITY_FIELDS) {
    if (record[field] !== contract[field]) issues.push(`admission:identity_mismatch:${field}`);
  }
  if (record.status !== LAUNCHABLE_STATUS || contract.registryStatus !== record.status) {
    issues.push(
      `admission:status_not_launchable:contract:${String(contract.registryStatus)}:record:${String(record.status)}`
    );
  }
  if (record.supersededBy !== null || record.supersededFrom !== null) {
    issues.push('admission:launchable_record_has_supersession_terminal_metadata');
  }
  return { ok: issues.length === 0, issues };
}
