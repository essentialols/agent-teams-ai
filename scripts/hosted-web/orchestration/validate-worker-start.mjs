#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  formatIssues,
  parseCliArgs,
  readJsonFile,
  validateWorkerStartContract,
} from './contract-lib.mjs';

export function validateWorkerStartFile(contractPath) {
  const absolutePath = path.resolve(contractPath);
  return validateWorkerStartContract(readJsonFile(absolutePath));
}

function main() {
  const args = parseCliArgs(process.argv.slice(2), ['contract']);
  if (!args.contract) throw new Error('--contract is required');
  const result = validateWorkerStartFile(args.contract);
  if (!result.ok) throw new Error(formatIssues('worker-start validation', result.issues));
  process.stdout.write('worker-start contract valid\n');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
