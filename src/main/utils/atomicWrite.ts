import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const RENAME_MAX_ATTEMPTS = 20;
const RENAME_RETRY_BASE_DELAY_MS = 40;
const RENAME_RETRY_MAX_DELAY_MS = 250;
const RENAME_RETRY_JITTER_MS = 25;
const RETRYABLE_RENAME_CODES = new Set(['EPERM', 'EACCES', 'EBUSY']);

export interface AtomicWriteOptions {
  mode?: number;
  /** Existing callers keep best-effort fsync; review mutations opt into strict durability. */
  durability?: 'best-effort' | 'strict';
  /** Persist the directory entry after publish when the caller needs crash durability. */
  syncDirectory?: boolean;
  /**
   * Runs after the temporary file is complete and synced, immediately before every
   * publish attempt (including Windows retries).
   * Callers can use this to repeat a compare-and-swap guard without exposing a
   * partially-written target.
   */
  beforeCommit?: () => Promise<void>;
}

export interface AtomicCreateResult {
  dev: number;
  ino: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getRenameRetryDelayMs(attempt: number): number {
  const backoff = Math.min(RENAME_RETRY_BASE_DELAY_MS * attempt, RENAME_RETRY_MAX_DELAY_MS);
  return backoff + Math.floor(Math.random() * (RENAME_RETRY_JITTER_MS + 1));
}

async function renameWithRetry(
  src: string,
  dest: string,
  beforeAttempt?: () => Promise<void>
): Promise<void> {
  for (let attempt = 1; attempt <= RENAME_MAX_ATTEMPTS; attempt++) {
    await beforeAttempt?.();
    try {
      await fs.promises.rename(src, dest);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code && RETRYABLE_RENAME_CODES.has(code) && attempt < RENAME_MAX_ATTEMPTS) {
        await sleep(getRenameRetryDelayMs(attempt));
        continue;
      }
      throw error;
    }
  }
}

function renameWithRetrySync(src: string, dest: string): void {
  for (let attempt = 1; attempt <= RENAME_MAX_ATTEMPTS; attempt++) {
    try {
      fs.renameSync(src, dest);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code && RETRYABLE_RENAME_CODES.has(code) && attempt < RENAME_MAX_ATTEMPTS) {
        sleepSync(getRenameRetryDelayMs(attempt));
        continue;
      }
      throw error;
    }
  }
}

export async function renamePathWithRetry(
  src: string,
  dest: string,
  options: { syncDirectories?: boolean } = {}
): Promise<void> {
  for (let attempt = 1; attempt <= RENAME_MAX_ATTEMPTS; attempt++) {
    try {
      await fs.promises.rename(src, dest);
      if (options.syncDirectories) {
        await syncRenamedDirectoriesBestEffort(src, dest);
      }
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code && RETRYABLE_RENAME_CODES.has(code) && attempt < RENAME_MAX_ATTEMPTS) {
        await sleep(getRenameRetryDelayMs(attempt));
        continue;
      }
      throw error;
    }
  }
}

export function renamePathWithRetrySync(src: string, dest: string): void {
  renameWithRetrySync(src, dest);
}

export function atomicWriteSync(
  targetPath: string,
  data: string | Buffer,
  options: { mode?: number } = {}
): void {
  const dir = path.dirname(targetPath);
  const tmpPath = path.join(dir, `.tmp.${randomUUID()}`);

  try {
    fs.mkdirSync(dir, { recursive: true });
    if (options.mode === undefined) {
      fs.writeFileSync(tmpPath, data, typeof data === 'string' ? 'utf8' : undefined);
    } else {
      fs.writeFileSync(tmpPath, data, {
        ...(typeof data === 'string' ? { encoding: 'utf8' as const } : {}),
        mode: options.mode,
      });
    }
    renameWithRetrySync(tmpPath, targetPath);
  } catch (error) {
    fs.rmSync(tmpPath, { force: true });
    throw error;
  }
}

/**
 * Async atomic write: write tmp file then rename over target.
 * Uses best-effort fsync and bounded Windows transient rename retries for safety.
 */
export async function atomicWriteAsync(
  targetPath: string,
  data: string | Buffer,
  options: AtomicWriteOptions = {}
): Promise<void> {
  const dir = path.dirname(targetPath);
  const tmpPath = path.join(dir, `.tmp.${randomUUID()}`);

  try {
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(tmpPath, data, {
      ...(typeof data === 'string' ? { encoding: 'utf8' as const } : {}),
      flag: 'wx',
      ...(options.mode === undefined ? {} : { mode: options.mode }),
    });

    await syncFile(tmpPath, options.durability === 'strict');
    await renameWithRetry(tmpPath, targetPath, options.beforeCommit);
    if (options.syncDirectory) {
      await syncDirectoryBestEffort(dir);
    }
  } catch (error) {
    await fs.promises.unlink(tmpPath).catch(() => undefined);
    throw error;
  }
}

/**
 * Publish a fully-written new file without ever overwriting a concurrently-created target.
 * A hard-link publish is atomic on the same filesystem. If the process stops between link
 * and temporary-name cleanup, the target still contains the complete synced payload.
 */
export async function atomicCreateAsync(
  targetPath: string,
  data: string | Buffer,
  options: { mode?: number } = {}
): Promise<AtomicCreateResult> {
  const dir = path.dirname(targetPath);
  const tmpPath = path.join(dir, `.review-create.${randomUUID()}.tmp`);

  try {
    await fs.promises.mkdir(dir, { recursive: true });
    if (options.mode === undefined) {
      await fs.promises.writeFile(tmpPath, data, {
        ...(typeof data === 'string' ? { encoding: 'utf8' as const } : {}),
        flag: 'wx',
      });
    } else {
      await fs.promises.writeFile(tmpPath, data, {
        ...(typeof data === 'string' ? { encoding: 'utf8' as const } : {}),
        flag: 'wx',
        mode: options.mode,
      });
    }

    await syncFile(tmpPath, true);
    const identity = await fs.promises.lstat(tmpPath);
    await fs.promises.link(tmpPath, targetPath);
    try {
      await fs.promises.unlink(tmpPath);
    } catch {
      // The target is already a fully synced, atomically published hardlink. Report
      // terminal success instead of deleting it or making a lost IPC response
      // ambiguous. A later authorization pass removes this reserved sibling link.
    }
    await syncDirectoryBestEffort(dir);
    return { dev: identity.dev, ino: identity.ino };
  } catch (error) {
    await fs.promises.unlink(tmpPath).catch(() => undefined);
    throw error;
  }
}

async function syncFile(filePath: string, strict: boolean): Promise<void> {
  let fd: fs.promises.FileHandle | null = null;
  let firstError: unknown = null;
  try {
    fd = await fs.promises.open(filePath, 'r+');
    await fd.sync();
  } catch (error) {
    firstError = error;
  } finally {
    try {
      await fd?.close();
    } catch (error) {
      firstError ??= error;
    }
  }
  if (firstError && strict) {
    throw firstError instanceof Error
      ? firstError
      : new Error('File synchronization failed with a non-Error value', { cause: firstError });
  }
}

async function syncDirectoryBestEffort(dirPath: string): Promise<void> {
  let fd: fs.promises.FileHandle | null = null;
  try {
    fd = await fs.promises.open(dirPath, 'r');
    await fd.sync();
  } catch {
    // Directory fsync is unsupported on some platforms (notably Windows).
  } finally {
    try {
      await fd?.close();
    } catch {
      // Best-effort close after best-effort fsync.
    }
  }
}

async function syncRenamedDirectoriesBestEffort(src: string, dest: string): Promise<void> {
  const sourceDir = path.dirname(src);
  const destinationDir = path.dirname(dest);
  await syncDirectoryBestEffort(destinationDir);
  if (sourceDir !== destinationDir) {
    await syncDirectoryBestEffort(sourceDir);
  }
}

export async function unlinkPathDurably(filePath: string): Promise<void> {
  await fs.promises.unlink(filePath);
  await syncDirectoryBestEffort(path.dirname(filePath));
}

/** Remove only crash-left atomic-create temp names that still reference this exact inode. */
export async function cleanupAtomicCreateTempLinks(targetPath: string): Promise<void> {
  const target = await fs.promises.lstat(targetPath);
  if (target.nlink <= 1) return;

  const dir = path.dirname(targetPath);
  const entries = await fs.promises.readdir(dir);
  for (const entry of entries) {
    if (!/^\.review-create\.[a-f0-9-]+\.tmp$/i.test(entry)) continue;
    const candidatePath = path.join(dir, entry);
    try {
      const candidate = await fs.promises.lstat(candidatePath);
      if (candidate.dev === target.dev && candidate.ino === target.ino) {
        await fs.promises.unlink(candidatePath);
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw error;
    }
  }
  await syncDirectoryBestEffort(dir);
}
