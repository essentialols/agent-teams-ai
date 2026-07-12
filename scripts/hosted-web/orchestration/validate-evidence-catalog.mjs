#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatIssues, parseCliArgs, readJsonFile } from './contract-lib.mjs';
import { validateEvidenceCatalog } from './evidence-catalog.mjs';

function main() {
  const args = parseCliArgs(process.argv.slice(2), ['catalog', 'repo-root']);
  if (!args.catalog) throw new Error('--catalog is required');
  if (!args['repo-root']) throw new Error('--repo-root is required');
  const result = validateEvidenceCatalog(readJsonFile(path.resolve(args.catalog)), {
    repoRoot: path.resolve(args['repo-root']),
  });
  if (!result.ok) throw new Error(formatIssues('evidence catalog validation', result.issues));
  process.stdout.write('evidence catalog valid\n');
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
