import * as path from 'path';

import {
  createInboxJsonFileSet,
  mergeInboxMessageLists,
  parseInboxMessageListRaw,
  planInboxDuplicateMerge,
} from './TeamProvisioningConfigLaunchNormalization';

export interface DuplicateInboxMergePorts {
  readDir(dirPath: string): Promise<string[]>;
  readRegularFileUtf8(
    filePath: string,
    options: { timeoutMs: number; maxBytes: number }
  ): Promise<string | null | undefined>;
  writeFileUtf8(filePath: string, contents: string): Promise<void>;
  unlink(filePath: string): Promise<void>;
}

export interface MergeAndRemoveDuplicateInboxesInput {
  inboxDir: string;
  baseNames: ReadonlySet<string>;
  timeoutMs: number;
  maxBytes: number;
  ports: DuplicateInboxMergePorts;
}

export async function mergeAndRemoveDuplicateInboxes(
  input: MergeAndRemoveDuplicateInboxesInput
): Promise<void> {
  if (input.baseNames.size === 0) return;

  let entries: string[];
  try {
    entries = await input.ports.readDir(input.inboxDir);
  } catch {
    return;
  }

  const existing = createInboxJsonFileSet(entries);

  for (const baseName of input.baseNames) {
    const mergePlan = planInboxDuplicateMerge(baseName, existing);
    if (!mergePlan) continue;

    const canonicalPath = path.join(input.inboxDir, mergePlan.canonicalFile);
    let canonicalRaw: string;
    try {
      const raw = await input.ports.readRegularFileUtf8(canonicalPath, {
        timeoutMs: input.timeoutMs,
        maxBytes: input.maxBytes,
      });
      if (!raw) {
        continue;
      }
      canonicalRaw = raw;
    } catch {
      continue;
    }

    const canonicalList = parseInboxMessageListRaw(canonicalRaw);
    const duplicateLists: unknown[][] = [];
    for (const dupFile of mergePlan.duplicateFiles) {
      const dupPath = path.join(input.inboxDir, dupFile);
      let dupRaw: string;
      try {
        const raw = await input.ports.readRegularFileUtf8(dupPath, {
          timeoutMs: input.timeoutMs,
          maxBytes: input.maxBytes,
        });
        if (!raw) {
          continue;
        }
        dupRaw = raw;
      } catch {
        continue;
      }

      duplicateLists.push(parseInboxMessageListRaw(dupRaw));
    }

    const mergedDeduped = mergeInboxMessageLists(canonicalList, duplicateLists);

    try {
      await input.ports.writeFileUtf8(canonicalPath, JSON.stringify(mergedDeduped, null, 2));
    } catch {
      continue;
    }

    for (const dupFile of mergePlan.duplicateFiles) {
      try {
        await input.ports.unlink(path.join(input.inboxDir, dupFile));
        existing.delete(dupFile);
      } catch {
        // Best-effort cleanup.
      }
    }
  }
}
