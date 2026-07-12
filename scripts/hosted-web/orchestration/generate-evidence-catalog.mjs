#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { formatIssues, parseCliArgs, readJsonFile } from './contract-lib.mjs';
import { generateEvidenceCatalog } from './evidence-catalog.mjs';

function main() {
  const args = parseCliArgs(process.argv.slice(2), ['source', 'output', 'repo-root']);
  for (const required of ['source', 'output', 'repo-root']) {
    if (!args[required]) throw new Error(`--${required} is required`);
  }
  const outputPath = path.resolve(args.output);
  const result = generateEvidenceCatalog(
    readJsonFile(path.resolve(args.source)),
    path.resolve(args['repo-root'])
  );
  if (!result.ok) throw new Error(formatIssues('evidence catalog generation', result.issues));
  writeFileSync(outputPath, `${JSON.stringify(result.catalog, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  process.stdout.write(`${outputPath}\n`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
