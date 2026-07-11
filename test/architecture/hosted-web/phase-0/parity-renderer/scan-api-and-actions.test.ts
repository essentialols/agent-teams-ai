import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  type ChildControlCatalog,
  CONTROL_ROOTS,
  discoverControlClosure,
  findDynamicDispatch,
  scanApiInterfaces,
  scanControls,
  type SemanticRow,
  validateApiDispositions,
  validateChildControlCatalog,
  validateControlClosure,
  validateJsonSchema,
  validateSemanticCatalog,
} from '../../../../../scripts/hosted-web/phase-0/parity-renderer/scan-api-and-actions';

const source = `
  const Fixture = () => <div onClick={(event) => event.stopPropagation()}>
    <Input onChange={(event) => setCredential(event.target.value)} />
    <Select onValueChange={setProvider}><SelectTrigger /><SelectItem value="x" /></Select>
  </div>;
`;
const file = 'fixture.tsx';
const sites = scanControls(source, file);
const key = (needle: string) => sites.find((site) => site.text.includes(needle))!;
const ref = (site: (typeof sites)[number]) => ({
  file,
  sourceHash: `sha256:${site.sourceHash}`,
  siteCount: 1,
});
const action = (id: string, refs: ReturnType<typeof ref>[]): SemanticRow => ({
  id,
  owner: 'runtime-provider-management',
  disposition: 'direct',
  securityClass: 'provider-credential',
  target: 'WP-4',
  evidence: ['fixture'],
  sourceRefs: refs,
});

describe('Phase 0 W1 semantic scanner', () => {
  it('maps event containment to absence and a multi-part Select to one semantic action', () => {
    const selectRefs = sites.filter((site) => site.element.startsWith('Select')).map(ref);
    expect(() =>
      validateSemanticCatalog(
        sites,
        [
          action('provider.management.credentials.edit', [ref(key('setCredential'))]),
          action('provider.management.select', selectRefs),
        ],
        [
          {
            id: 'P0.W1.ABSENCE.event-containment',
            reason: 'not an action',
            sourceRefs: [ref(key('stopPropagation'))],
          },
        ]
      )
    ).not.toThrow();
  });

  it('rejects a missing semantic action mapping', () => {
    expect(() => validateSemanticCatalog(sites, [], [])).toThrow(/Missing or stale/);
  });

  it('rejects a duplicate semantic assignment', () => {
    const credential = ref(key('setCredential'));
    expect(() =>
      validateSemanticCatalog(
        [key('setCredential')],
        [
          action('provider.management.credentials.edit', [credential]),
          action('provider.management.credentials.replace', [credential]),
        ],
        []
      )
    ).toThrow(/assigned twice/);
  });

  it('keeps semantic IDs stable when unrelated lines are inserted', () => {
    const shifted = scanControls(`\n\n// unrelated\n${source}`, file);
    expect(shifted.map((site) => site.sourceHash)).toEqual(sites.map((site) => site.sourceHash));
    expect(action('provider.management.credentials.edit', []).id).toBe(
      'provider.management.credentials.edit'
    );
  });

  it('keeps an explicit child action ID stable across unrelated line shifts', () => {
    const childFile = 'fixture/ImmediateChild.tsx';
    const childSource =
      'export const ImmediateChild = () => <button onClick={handleRefresh}>Refresh</button>;';
    const childSite = scanControls(childSource, childFile)[0];
    const actionId = 'team.legacy-control.immediate-child.refresh';
    const catalog: ChildControlCatalog = {
      schemaId: 'fixture',
      schemaVersion: 2,
      evidenceId: 'fixture',
      packetRevision: 'phase-00-r2',
      pinnedBaseSha: 'fixture',
      phaseStartSha: 'fixture',
      roots: [childFile],
      sourceFiles: [childFile],
      actions: {
        [actionId]: 'team-console|direct|renderer-local|WP-7-TEAM-CONSOLE|fixture',
      },
      absences: {},
      mappings: {
        [`${childFile}#sha256:${childSite.sourceHash}`]: `1|${actionId}`,
      },
    };
    expect(() => validateChildControlCatalog([childSite], catalog)).not.toThrow();
    expect(() =>
      validateChildControlCatalog(
        scanControls(`\n// unrelated\n${childSource}`, childFile),
        catalog
      )
    ).not.toThrow();
  });

  it('rejects omission of a reachable immediate child and its real control mapping', () => {
    const root = process.cwd();
    const readSource = (file: string): string | undefined => {
      const absolute = join(root, file);
      return existsSync(absolute) && statSync(absolute).isFile()
        ? readFileSync(absolute, 'utf8')
        : undefined;
    };
    const discovered = discoverControlClosure(CONTROL_ROOTS, readSource);
    const catalog = JSON.parse(
      readFileSync(
        join(
          root,
          'docs/research/hosted-web/phase-0/parity-renderer/renderer-child-control-catalog.json'
        ),
        'utf8'
      )
    ) as ChildControlCatalog;
    const omittedFile = 'src/renderer/components/team/TeamListFilterPopover.tsx';
    expect(() =>
      validateControlClosure(
        discovered,
        catalog.sourceFiles.filter((file) => file !== omittedFile)
      )
    ).toThrow(/TeamListFilterPopover/);

    const sites = discovered.flatMap((file) => scanControls(readSource(file)!, file));
    const omittedMapping = Object.keys(catalog.mappings).find((key) =>
      key.startsWith(`${omittedFile}#`)
    )!;
    const mappings = { ...catalog.mappings };
    delete mappings[omittedMapping];
    expect(() => validateChildControlCatalog(sites, { ...catalog, mappings })).toThrow(
      /Missing child control mapping.*TeamListFilterPopover/
    );
  });

  it('fails an unannotated dynamic dispatch and accepts an annotation', () => {
    expect(findDynamicDispatch('api.teams[name]()')).toEqual(['api.teams[name]']);
    expect(
      findDynamicDispatch('// @hosted-web-dynamic-action team.lifecycle.stop\napi.teams[name]()')
    ).toEqual([]);
  });

  it('rejects missing and duplicate API member dispositions', () => {
    const api = scanApiInterfaces(
      'interface TeamsAPI { stop(): Promise<void>; list(): Promise<void> } interface ReviewAPI {} interface CrossTeamAPI {}'
    );
    expect(() =>
      validateApiDispositions(api, [{ source: 'TeamsAPI', sourceMember: 'stop' }])
    ).toThrow(/exactly once/);
    expect(() =>
      validateApiDispositions(api, [
        { source: 'TeamsAPI', sourceMember: 'stop' },
        { source: 'TeamsAPI', sourceMember: 'stop' },
      ])
    ).toThrow(/exactly once/);
    expect(() =>
      validateApiDispositions(api, [
        { source: 'TeamsAPI', sourceMember: 'list' },
        { source: 'TeamsAPI', sourceMember: 'stop' },
      ])
    ).not.toThrow();
  });

  it('validates nested schema requirements and rejects a missing acceptance field', () => {
    const schema = {
      type: 'object',
      required: ['actions'],
      properties: { actions: { type: 'array', items: { type: 'object', required: ['owner'] } } },
    };
    expect(() =>
      validateJsonSchema({ actions: [{ owner: 'team-lifecycle' }] }, schema)
    ).not.toThrow();
    expect(() => validateJsonSchema({ actions: [{}] }, schema)).toThrow(/owner is required/);
  });
});
