import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const HOSTED_FEATURE_DIR = 'src/features/hosted-integrations';
const RENDERER_DIR = 'src/renderer';
const PRELOAD_DIR = 'src/preload';

const FORBIDDEN_GITHUB_SDK_IMPORTS = [
  '@octokit/',
  'octokit',
  'probot',
  '@actions/github',
  '@octokit/core',
  '@octokit/rest',
];

const FORBIDDEN_RENDERER_TARGETS = [
  'src/features/hosted-integrations/main',
  'src/features/hosted-integrations/main/infrastructure/ControlPlaneHttpClient',
  'src/features/hosted-integrations/main/infrastructure/ElectronSafeStorageDesktopTokenStore',
];

const FORBIDDEN_CORE_TARGETS = [
  'src/features/hosted-integrations/main',
  'src/features/hosted-integrations/preload',
  'src/features/hosted-integrations/renderer',
  'src/main',
  'src/preload',
  'src/renderer',
];

const FORBIDDEN_CORE_IMPORTS = [
  'electron',
  'react',
  'react-dom',
  'fastify',
  '@main/',
  '@renderer/',
  '@preload/',
  'undici',
  'node-fetch',
];

const IMPORT_SPECIFIER_PATTERN =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s*)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

export async function checkHostedIntegrationsBoundaries(options = {}) {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const files = await collectSourceFiles(rootDir, [HOSTED_FEATURE_DIR, RENDERER_DIR, PRELOAD_DIR]);
  const violations = [];

  for (const absoluteFile of files) {
    const source = await readFile(absoluteFile, 'utf8');
    const relativeFile = toPosix(relative(rootDir, absoluteFile));
    for (const specifier of extractImportSpecifiers(source)) {
      const resolvedTarget = resolveImportTarget(rootDir, relativeFile, specifier);
      validateImport({ relativeFile, resolvedTarget, specifier, violations });
    }
  }

  return violations;
}

function validateImport({ relativeFile, resolvedTarget, specifier, violations }) {
  const isHostedFeatureFile = isInside(relativeFile, HOSTED_FEATURE_DIR);
  const isHostedCoreFile = isInside(relativeFile, `${HOSTED_FEATURE_DIR}/core`);
  const isHostedRendererFile = isInside(relativeFile, `${HOSTED_FEATURE_DIR}/renderer`);
  const isHostedPreloadFile = isInside(relativeFile, `${HOSTED_FEATURE_DIR}/preload`);
  const isRendererFile = isInside(relativeFile, RENDERER_DIR) || isHostedRendererFile;
  const isPreloadFile = isInside(relativeFile, PRELOAD_DIR) || isHostedPreloadFile;

  if (
    isHostedFeatureFile &&
    FORBIDDEN_GITHUB_SDK_IMPORTS.some((forbidden) => matchesPackageImport(specifier, forbidden))
  ) {
    violations.push(
      `${relativeFile}: hosted integrations must not import GitHub SDK package "${specifier}"`
    );
  }

  if (
    isHostedCoreFile &&
    FORBIDDEN_CORE_IMPORTS.some((forbidden) => matchesPackageImport(specifier, forbidden))
  ) {
    violations.push(
      `${relativeFile}: hosted integrations core must not import platform package "${specifier}"`
    );
  }

  if (
    isHostedCoreFile &&
    FORBIDDEN_CORE_TARGETS.some((forbiddenTarget) => isInside(resolvedTarget, forbiddenTarget))
  ) {
    violations.push(
      `${relativeFile}: hosted integrations core must not import platform layer "${specifier}"`
    );
  }

  if (
    (isRendererFile || isPreloadFile) &&
    FORBIDDEN_RENDERER_TARGETS.some((forbiddenTarget) => isInside(resolvedTarget, forbiddenTarget))
  ) {
    violations.push(
      `${relativeFile}: renderer/preload must not import hosted main adapter "${specifier}"`
    );
  }

  if (
    isHostedRendererFile &&
    (specifier === 'electron' || matchesPackageImport(specifier, '@main/'))
  ) {
    violations.push(
      `${relativeFile}: hosted integrations renderer must use preload contracts, not "${specifier}"`
    );
  }
}

async function collectSourceFiles(rootDir, relativeDirs) {
  const allFiles = [];
  for (const relativeDir of relativeDirs) {
    await walk(join(rootDir, relativeDir), allFiles);
  }
  return allFiles;
}

async function walk(currentPath, allFiles) {
  let entries;
  try {
    entries = await readdir(currentPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    const absoluteEntry = join(currentPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') {
        continue;
      }
      await walk(absoluteEntry, allFiles);
      continue;
    }
    if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      allFiles.push(absoluteEntry);
    }
  }
}

function extractImportSpecifiers(source) {
  return [...source.matchAll(IMPORT_SPECIFIER_PATTERN)]
    .map((match) => match[1] ?? match[2] ?? match[3])
    .filter(Boolean);
}

function resolveImportTarget(rootDir, relativeFile, specifier) {
  if (specifier.startsWith('.')) {
    return toPosix(relative(rootDir, resolve(rootDir, dirname(relativeFile), specifier)));
  }
  if (specifier.startsWith('@features/')) {
    return specifier.replace('@features/', 'src/features/');
  }
  if (specifier.startsWith('@main/')) {
    return specifier.replace('@main/', 'src/main/');
  }
  if (specifier.startsWith('@renderer/')) {
    return specifier.replace('@renderer/', 'src/renderer/');
  }
  if (specifier.startsWith('@preload/')) {
    return specifier.replace('@preload/', 'src/preload/');
  }
  return specifier;
}

function isInside(value, directory) {
  const normalizedValue = trimTrailingSlash(toPosix(normalize(value)));
  const normalizedDirectory = trimTrailingSlash(toPosix(normalize(directory)));
  return (
    normalizedValue === normalizedDirectory || normalizedValue.startsWith(`${normalizedDirectory}/`)
  );
}

function matchesPackageImport(specifier, forbidden) {
  return specifier === forbidden || specifier.startsWith(forbidden);
}

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function toPosix(value) {
  return value.split(sep).join('/');
}

async function main() {
  const violations = await checkHostedIntegrationsBoundaries();
  if (violations.length > 0) {
    console.error('Hosted integrations architecture boundary violations:');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exitCode = 1;
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  await main();
}
