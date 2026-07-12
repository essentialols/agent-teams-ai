#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatIssues, parseCliArgs, readJsonFile } from './contract-lib.mjs';
import { validateWorkerAdmission } from './orchestration-state.mjs';

export function validateWorkerAdmissionFiles(contractPath, statePath, options = {}) {
  return validateWorkerAdmission(
    readJsonFile(path.resolve(contractPath)),
    readJsonFile(path.resolve(statePath)),
    options
  );
}

function main() {
  const args = parseCliArgs(process.argv.slice(2), ['contract', 'state']);
  if (!args.contract) throw new Error('--contract is required');
  if (!args.state) throw new Error('--state is required');
  const result = validateWorkerAdmissionFiles(args.contract, args.state);
  if (!result.ok) throw new Error(formatIssues('worker admission', result.issues));
  process.stdout.write('worker admission valid: exactly one queued registry record\n');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
