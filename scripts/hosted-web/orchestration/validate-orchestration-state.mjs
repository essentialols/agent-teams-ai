#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatIssues, parseCliArgs, readJsonFile } from './contract-lib.mjs';
import { validateOrchestrationState } from './orchestration-state.mjs';

function main() {
  const args = parseCliArgs(process.argv.slice(2), ['state']);
  if (!args.state) throw new Error('--state is required');
  const result = validateOrchestrationState(readJsonFile(path.resolve(args.state)));
  if (!result.ok) throw new Error(formatIssues('orchestration-state validation', result.issues));
  process.stdout.write('orchestration state valid\n');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
