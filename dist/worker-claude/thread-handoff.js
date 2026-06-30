import { createHash, randomUUID } from "node:crypto";
import { cp, lstat, mkdir, readdir, readFile, realpath, rename, rm, stat, writeFile, } from "node:fs/promises";
import { dirname, isAbsolute, join, posix, relative, win32 } from "node:path";
const defaultThreadLockAcquireTimeoutMs = 10_000;
const defaultThreadLockTtlMs = 5 * 60_000;
const defaultThreadLockHeartbeatMs = 30_000;
const threadLockRecordFileName = "owner.json";
export class ClaudeLogicalThreadConflictError extends Error {
    threadId;
    expectedGeneration;
    actualGeneration;
    constructor(threadId, expectedGeneration, actualGeneration) {
        super("claude_logical_thread_generation_conflict");
        this.threadId = threadId;
        this.expectedGeneration = expectedGeneration;
        this.actualGeneration = actualGeneration;
        this.name = "ClaudeLogicalThreadConflictError";
    }
}
export class FileClaudeLogicalThreadStore {
    rootDir;
    threadsDir;
    locksDir;
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.threadsDir = join(rootDir, "threads");
        this.locksDir = join(rootDir, "locks");
    }
    async read(threadId) {
        try {
            return parseThreadState(await readFile(this.threadPath(threadId), "utf8"));
        }
        catch (error) {
            if (isNodeError(error) && error.code === "ENOENT")
                return null;
            throw error;
        }
    }
    async compareAndSwap(input) {
        const result = await this.updateExclusive({
            threadId: input.threadId,
            update: async (current) => {
                const actualGeneration = current?.generation ?? 0;
                if (actualGeneration !== input.expectedGeneration) {
                    throw new ClaudeLogicalThreadConflictError(input.threadId, input.expectedGeneration, actualGeneration);
                }
                return { next: input.next, value: undefined };
            },
        });
        return result.state;
    }
    async updateExclusive(input) {
        return this.withThreadLock(input.threadId, async () => {
            const current = await this.read(input.threadId);
            const { next, value } = await input.update(current);
            const state = await this.writeNextState(input.threadId, current?.generation ?? 0, next);
            return { state, value };
        });
    }
    async writeNextState(threadId, currentGeneration, next) {
        const state = {
            ...next,
            generation: currentGeneration + 1,
        };
        await mkdir(this.threadsDir, { recursive: true, mode: 0o700 });
        const path = this.threadPath(threadId);
        const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
        await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, {
            mode: 0o600,
        });
        await rename(tempPath, path);
        return state;
    }
    async withThreadLock(threadId, action) {
        await mkdir(this.locksDir, { recursive: true, mode: 0o700 });
        const lockPath = join(this.locksDir, `${hashText(threadId)}.lock`);
        const lockId = `thread-lock:${randomUUID()}`;
        const deadline = Date.now() + defaultThreadLockAcquireTimeoutMs;
        while (true) {
            try {
                await mkdir(lockPath, { mode: 0o700 });
                try {
                    await writeThreadLockRecord(lockPath, {
                        storageVersion: "claude-logical-thread-lock-v1",
                        lockId,
                        acquiredAt: new Date().toISOString(),
                        pid: process.pid,
                    });
                }
                catch (error) {
                    await rm(lockPath, { recursive: true, force: true });
                    throw error;
                }
                break;
            }
            catch (error) {
                if (!isNodeError(error) || error.code !== "EEXIST")
                    throw error;
                await removeStaleThreadLock(lockPath, new Date());
                if (Date.now() >= deadline) {
                    throw new Error("claude_logical_thread_lock_timeout");
                }
                await delay(25);
            }
        }
        const heartbeatTimer = startThreadLockHeartbeat(lockPath, lockId);
        try {
            return await action();
        }
        finally {
            heartbeatTimer.dispose();
            await releaseThreadLock(lockPath, lockId);
        }
    }
    threadPath(threadId) {
        return join(this.threadsDir, `${hashText(threadId)}.json`);
    }
}
export class FileClaudeTranscriptBundleStore {
    rootDir;
    bundlesDir;
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.bundlesDir = join(rootDir, "bundles");
    }
    async capture(input) {
        const sessionId = requireSafeId(input.sessionId);
        const sourceConfigDir = await realpath(input.sourceConfigDir);
        const transcriptPath = await findTranscriptPath(sourceConfigDir, sessionId);
        if (!transcriptPath) {
            throw new Error("claude_transcript_not_found");
        }
        const projectDir = dirname(transcriptPath);
        const files = await transcriptBundleFiles(projectDir, sessionId);
        const bundleId = `bundle-${hashText(`${input.cwd}:${sessionId}:${Date.now()}:${randomUUID()}`).slice(0, 24)}`;
        const bundleDir = this.bundleDir(bundleId);
        const filesDir = join(bundleDir, "files");
        await mkdir(filesDir, { recursive: true, mode: 0o700 });
        const relativeFiles = [];
        for (const filePath of files) {
            const relativePath = requireSafeRelativePath(relative(sourceConfigDir, filePath));
            relativeFiles.push(relativePath);
            const targetPath = join(filesDir, relativePath);
            await mkdir(dirname(targetPath), { recursive: true, mode: 0o700 });
            await cp(filePath, targetPath, { force: true });
        }
        const bundle = {
            bundleId,
            cwd: await realpath(input.cwd),
            sessionId,
            sourceConfigDir,
            files: relativeFiles.sort(),
            capturedAt: new Date().toISOString(),
        };
        await writeFile(join(bundleDir, "manifest.json"), `${JSON.stringify(bundle, null, 2)}\n`, { mode: 0o600 });
        return bundle;
    }
    async materialize(input) {
        const bundleDir = this.bundleDir(input.bundleId);
        const bundle = parseBundle(await readFile(join(bundleDir, "manifest.json"), "utf8"));
        const targetConfigDir = await ensureRealDirectory(input.targetConfigDir);
        const filesDir = join(bundleDir, "files");
        for (const file of bundle.files) {
            const relativePath = requireSafeRelativePath(file);
            const sourcePath = join(filesDir, relativePath);
            const sourceStats = await lstat(sourcePath);
            if (!sourceStats.isFile()) {
                throw new Error("claude_transcript_bundle_file_invalid");
            }
            const targetPath = join(targetConfigDir, relativePath);
            await mkdir(dirname(targetPath), { recursive: true, mode: 0o700 });
            await cp(sourcePath, targetPath, { force: true });
        }
        return bundle;
    }
    async remove(input) {
        await rm(this.bundleDir(input.bundleId), { recursive: true, force: true });
    }
    bundleDir(bundleId) {
        return join(this.bundlesDir, requireSafeId(bundleId));
    }
}
async function findTranscriptPath(configDir, sessionId) {
    const projectsDir = join(configDir, "projects");
    try {
        return await findFile(projectsDir, `${sessionId}.jsonl`);
    }
    catch (error) {
        if (isNodeError(error) && error.code === "ENOENT")
            return null;
        throw error;
    }
}
async function findFile(dir, fileName) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isFile() && entry.name === fileName)
            return path;
        if (entry.isDirectory()) {
            const found = await findFile(path, fileName);
            if (found)
                return found;
        }
    }
    return null;
}
async function transcriptBundleFiles(projectDir, sessionId) {
    const main = join(projectDir, `${sessionId}.jsonl`);
    const files = new Set([main]);
    const sessionSidecarDir = join(projectDir, sessionId);
    if (await pathExists(sessionSidecarDir)) {
        for (const file of await listFiles(sessionSidecarDir))
            files.add(file);
    }
    const subagentsDir = join(projectDir, "subagents");
    if (await pathExists(subagentsDir)) {
        for (const file of await listFiles(subagentsDir))
            files.add(file);
    }
    return [...files].sort();
}
async function listFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isFile())
            files.push(path);
        if (entry.isDirectory())
            files.push(...(await listFiles(path)));
    }
    return files;
}
async function pathExists(path) {
    try {
        await stat(path);
        return true;
    }
    catch (error) {
        if (isNodeError(error) && error.code === "ENOENT")
            return false;
        throw error;
    }
}
async function ensureRealDirectory(path) {
    await mkdir(path, { recursive: true, mode: 0o700 });
    return realpath(path);
}
async function writeThreadLockRecord(lockPath, record) {
    await writeFile(join(lockPath, threadLockRecordFileName), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
}
async function releaseThreadLock(lockPath, lockId) {
    const record = await readThreadLockRecord(lockPath);
    if (record && record.lockId !== lockId)
        return;
    await rm(lockPath, { recursive: true, force: true });
}
function startThreadLockHeartbeat(lockPath, lockId) {
    const timer = setInterval(() => {
        void refreshThreadLockHeartbeat(lockPath, lockId);
    }, defaultThreadLockHeartbeatMs);
    timer.unref();
    return {
        dispose() {
            clearInterval(timer);
        },
    };
}
async function refreshThreadLockHeartbeat(lockPath, lockId) {
    const record = await readThreadLockRecord(lockPath).catch(() => null);
    if (!record || record.lockId !== lockId)
        return;
    await writeThreadLockRecord(lockPath, {
        ...record,
        heartbeatAt: new Date().toISOString(),
    }).catch(() => {
        // Best effort only. The stale-lock TTL still protects crashed workers.
    });
}
async function removeStaleThreadLock(lockPath, now) {
    if (!(await isThreadLockStale(lockPath, now)))
        return false;
    const stalePath = `${lockPath}.${process.pid}.${randomUUID()}.stale`;
    try {
        await rename(lockPath, stalePath);
    }
    catch (error) {
        if (isNodeError(error) && error.code === "ENOENT")
            return true;
        if (isNodeError(error) && error.code === "EEXIST")
            return false;
        throw error;
    }
    await rm(stalePath, { recursive: true, force: true });
    return true;
}
async function isThreadLockStale(lockPath, now) {
    const record = await readThreadLockRecord(lockPath);
    let lastSeenAtMs;
    if (record) {
        lastSeenAtMs = Date.parse(record.heartbeatAt ?? record.acquiredAt);
    }
    else {
        try {
            lastSeenAtMs = (await stat(lockPath)).mtimeMs;
        }
        catch (error) {
            if (isNodeError(error) && error.code === "ENOENT")
                return true;
            throw error;
        }
    }
    if (Number.isNaN(lastSeenAtMs))
        return true;
    return now.getTime() - lastSeenAtMs >= defaultThreadLockTtlMs;
}
async function readThreadLockRecord(lockPath) {
    try {
        return parseThreadLockRecord(await readFile(join(lockPath, threadLockRecordFileName), "utf8"));
    }
    catch (error) {
        if (isNodeError(error) && error.code === "ENOENT")
            return null;
        if (error instanceof SyntaxError)
            return null;
        if (error instanceof Error &&
            error.message === "claude_logical_thread_lock_record_invalid") {
            return null;
        }
        throw error;
    }
}
function parseThreadLockRecord(raw) {
    const value = JSON.parse(raw);
    if (!isRecord(value)) {
        throw new Error("claude_logical_thread_lock_record_invalid");
    }
    const lockId = nonEmptyString(value.lockId);
    const acquiredAt = validIsoDateString(value.acquiredAt);
    const heartbeatAt = optionalIsoDateString(value.heartbeatAt, "claude_logical_thread_lock_record_invalid");
    const pid = value.pid;
    if (value.storageVersion !== "claude-logical-thread-lock-v1" ||
        lockId === null ||
        acquiredAt === null ||
        typeof pid !== "number" ||
        !Number.isSafeInteger(pid)) {
        throw new Error("claude_logical_thread_lock_record_invalid");
    }
    return {
        storageVersion: "claude-logical-thread-lock-v1",
        lockId,
        acquiredAt,
        ...(heartbeatAt === undefined ? {} : { heartbeatAt }),
        pid,
    };
}
function parseThreadState(raw) {
    const value = JSON.parse(raw);
    if (!isRecord(value)) {
        throw new Error("claude_logical_thread_state_invalid");
    }
    const threadId = nonEmptyString(value.threadId);
    const cwd = absolutePathString(value.cwd);
    const generation = value.generation;
    const updatedAt = validIsoDateString(value.updatedAt);
    const latestSessionId = optionalSafeId(value.latestSessionId, "claude_logical_thread_state_invalid");
    const latestBundleId = optionalSafeId(value.latestBundleId, "claude_logical_thread_state_invalid");
    const latestProviderInstanceId = optionalNonEmptyString(value.latestProviderInstanceId, "claude_logical_thread_state_invalid");
    const latestWorkerId = optionalNonEmptyString(value.latestWorkerId, "claude_logical_thread_state_invalid");
    if (threadId === null ||
        cwd === null ||
        typeof generation !== "number" ||
        !Number.isSafeInteger(generation) ||
        generation < 0 ||
        updatedAt === null) {
        throw new Error("claude_logical_thread_state_invalid");
    }
    return {
        threadId,
        cwd,
        generation,
        ...(latestSessionId === undefined ? {} : { latestSessionId }),
        ...(latestBundleId === undefined ? {} : { latestBundleId }),
        ...(latestProviderInstanceId === undefined
            ? {}
            : { latestProviderInstanceId }),
        ...(latestWorkerId === undefined ? {} : { latestWorkerId }),
        updatedAt,
    };
}
function optionalSafeId(value, errorCode) {
    if (value === undefined)
        return undefined;
    if (typeof value !== "string")
        throw new Error(errorCode);
    try {
        return requireSafeId(value);
    }
    catch {
        throw new Error(errorCode);
    }
}
function optionalNonEmptyString(value, errorCode) {
    if (value === undefined)
        return undefined;
    const string = nonEmptyString(value);
    if (string === null)
        throw new Error(errorCode);
    return string;
}
function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0 ? value : null;
}
function absolutePathString(value) {
    const string = nonEmptyString(value);
    if (!string)
        return null;
    return isAbsolute(string) || win32.isAbsolute(string) ? string : null;
}
function validIsoDateString(value) {
    const string = nonEmptyString(value);
    if (!string || Number.isNaN(Date.parse(string)))
        return null;
    return string;
}
function optionalIsoDateString(value, errorCode) {
    if (value === undefined)
        return undefined;
    const string = validIsoDateString(value);
    if (string === null)
        throw new Error(errorCode);
    return string;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseBundle(raw) {
    const value = JSON.parse(raw);
    if (!isRecord(value)) {
        throw new Error("claude_transcript_bundle_invalid");
    }
    const bundleId = optionalSafeId(value.bundleId, "claude_transcript_bundle_invalid");
    const sessionId = optionalSafeId(value.sessionId, "claude_transcript_bundle_invalid");
    const cwd = absolutePathString(value.cwd);
    const sourceConfigDir = absolutePathString(value.sourceConfigDir);
    const capturedAt = validIsoDateString(value.capturedAt);
    if (bundleId === undefined ||
        sessionId === undefined ||
        cwd === null ||
        sourceConfigDir === null ||
        capturedAt === null ||
        !Array.isArray(value.files)) {
        throw new Error("claude_transcript_bundle_invalid");
    }
    return {
        bundleId,
        cwd,
        sessionId,
        sourceConfigDir,
        files: value.files.map((file) => {
            if (typeof file !== "string") {
                throw new Error("claude_transcript_bundle_invalid");
            }
            return requireSafeRelativePath(file);
        }),
        capturedAt,
    };
}
function requireSafeId(value) {
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(value)) {
        throw new Error("claude_safe_id_required");
    }
    return value;
}
function requireSafeRelativePath(value) {
    const normalizedInput = value.replace(/\\/g, "/");
    const normalizedPath = posix.normalize(normalizedInput);
    if (value.length === 0 ||
        value.includes("\0") ||
        isAbsolute(value) ||
        win32.isAbsolute(value) ||
        /^[A-Za-z]:/u.test(value) ||
        normalizedPath === "." ||
        normalizedPath === ".." ||
        normalizedPath.startsWith("../") ||
        normalizedInput.split("/").includes("..")) {
        throw new Error("claude_safe_relative_path_required");
    }
    return normalizedPath;
}
function isNodeError(error) {
    return error instanceof Error && "code" in error;
}
function hashText(value) {
    return createHash("sha256").update(value).digest("hex");
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=thread-handoff.js.map