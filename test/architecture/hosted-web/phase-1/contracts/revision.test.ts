import * as hosted from '@shared/contracts/hosted';

import invalid from './fixtures/invalid-contract-values.json';
import valid from './fixtures/valid-contract-values.json';
test('hosted tokens stay kind-separated and response schema versions fail closed', () => {
  expect(hosted.parseRevision(valid.revision)).toBe(valid.revision);
  expect(hosted.parseCursor(valid.cursor)).toBe(valid.cursor);
  expect(() => hosted.parseCursor(invalid.revisionAsCursor)).toThrow();
  expect(hosted.parseHostedSchemaVersion(valid.sameVersionResponse.schemaVersion)).toBe(
    hosted.HOSTED_SCHEMA_VERSION
  );
  expect(Object.keys(valid.sameVersionResponse)).toContain('additiveField');
  for (const version of [...invalid.schemaVersions, undefined]) {
    expect(() => hosted.parseHostedSchemaVersion(version)).toThrow(
      hosted.SCHEMA_VERSION_DIAGNOSTIC
    );
  }
});
