import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const checkerPath = resolve('scripts/ci/check-hosted-integrations-boundaries.mjs');

describe('hosted integrations architecture boundaries', () => {
  it('accepts renderer code that only imports hosted contracts', async () => {
    const root = await createFixtureRoot();
    await writeSource(
      root,
      'src/features/hosted-integrations/renderer/Panel.tsx',
      "import type { HostedIntegrationStateDto } from '../contracts';\nexport const state = null as HostedIntegrationStateDto | null;\n"
    );

    await expect(runChecker(root)).resolves.toEqual('');
  });

  it('rejects Nest/Electron/platform imports from hosted core', async () => {
    const root = await createFixtureRoot();
    await writeSource(
      root,
      'src/features/hosted-integrations/core/domain/policy.ts',
      "import { app } from 'electron';\nexport const leaked = app.name;\n"
    );

    await expect(runChecker(root)).rejects.toMatchObject({
      stderr: expect.stringContaining('core must not import platform package'),
    });
  });

  it('rejects renderer imports of main token storage adapters', async () => {
    const root = await createFixtureRoot();
    await writeSource(
      root,
      'src/features/hosted-integrations/renderer/Panel.tsx',
      "import { ElectronSafeStorageDesktopTokenStore } from '@features/hosted-integrations/main/infrastructure/ElectronSafeStorageDesktopTokenStore';\nexport const Store = ElectronSafeStorageDesktopTokenStore;\n"
    );

    await expect(runChecker(root)).rejects.toMatchObject({
      stderr: expect.stringContaining('renderer/preload must not import hosted main adapter'),
    });
  });
});

async function createFixtureRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'hosted-integrations-boundaries-'));
}

async function writeSource(root: string, relativePath: string, source: string): Promise<void> {
  const absolutePath = join(root, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, source, 'utf8');
}

async function runChecker(root: string): Promise<string> {
  const result = await execFileAsync(process.execPath, [checkerPath], {
    cwd: root,
  });
  return result.stdout;
}
