import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

export async function atomicWriteJson(
  path: string,
  value: Readonly<Record<string, unknown>>,
): Promise<void> {
  const targetDir = dirname(path);
  await mkdir(targetDir, { recursive: true, mode: 0o700 });
  const tempDir = await mkdtemp(join(targetDir, ".tmp-"));
  const tempPath = join(tempDir, basename(path));
  try {
    await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(tempPath, path);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
