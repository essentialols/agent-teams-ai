import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  EXTERNAL_WRITER_OBSERVATION_SCHEMA_VERSION,
  ExternalWriterObserver,
  FileObservationState,
} from '@features/external-writer-coordination';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../../..');
const CORE_PATHS = [
  'src/features/external-writer-coordination/contracts/externalWriterContracts.ts',
  'src/features/external-writer-coordination/core/domain/fileObservationState.ts',
  'src/features/external-writer-coordination/core/application/ExternalWriterObserver.ts',
  'src/features/external-writer-coordination/core/application/ports.ts',
] as const;
const FORBIDDEN_IMPORTS = [
  'electron',
  'fastify',
  'node:crypto',
  'node:fs',
  'node:path',
  '@main/',
  '@renderer/',
  '@preload/',
] as const;

describe('Phase 3 external-writer coordination boundary', () => {
  it('keeps contracts/core path-free, runtime-free, and behind consumer-owned ports', () => {
    for (const relativePath of CORE_PATHS) {
      // Paths come only from the frozen repository-owned allowlist above.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const source = readFileSync(resolve(ROOT, relativePath), 'utf8');
      const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
      for (const forbidden of FORBIDDEN_IMPORTS) {
        expect(
          imports.some((specifier) => specifier === forbidden || specifier.startsWith(forbidden)),
          `${relativePath} imports ${forbidden}`
        ).toBe(false);
      }
      expect(source).not.toMatch(/\b(currentRunRef|readFile|writeFile|watchFile|readdir)\b/);
    }
  });

  it('has no filesystem main adapter in the feature', () => {
    const featureRoot = resolve(ROOT, 'src/features/external-writer-coordination');
    /* eslint-disable security/detect-non-literal-fs-filename -- Fixed repository-owned negative fixture paths. */
    expect(() => readFileSync(resolve(featureRoot, 'main/index.ts'), 'utf8')).toThrow();
    expect(() =>
      readFileSync(resolve(featureRoot, 'main/infrastructure/index.ts'), 'utf8')
    ).toThrow();
    /* eslint-enable security/detect-non-literal-fs-filename */
  });

  it('exports the real observer/state contract from the public feature entrypoint', () => {
    expect(EXTERNAL_WRITER_OBSERVATION_SCHEMA_VERSION).toBe(2);
    expect(typeof ExternalWriterObserver).toBe('function');
    expect(typeof FileObservationState.create).toBe('function');
  });
});
