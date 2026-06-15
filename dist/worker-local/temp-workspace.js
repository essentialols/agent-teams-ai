import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
export class TempWorkspace {
    prefix;
    workspaceId = "temp-workspace";
    capabilities = {
        workspaceId: this.workspaceId,
        supportsTempDir: true,
        supportsExistingCheckout: true,
        supportsContainer: false,
    };
    constructor(prefix = "subscription-runtime-worker-") {
        this.prefix = prefix;
    }
    async create() {
        const path = await mkdtemp(join(tmpdir(), this.prefix));
        return {
            path,
            dispose: () => rm(path, { recursive: true, force: true }),
        };
    }
}
export class StableWorkerWorkspace {
    rootDir;
    workspaceId = "stable-worker-workspace";
    capabilities = {
        workspaceId: this.workspaceId,
        supportsTempDir: true,
        supportsExistingCheckout: true,
        supportsContainer: false,
    };
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    async create() {
        await mkdir(this.rootDir, { recursive: true, mode: 0o700 });
        return {
            path: this.rootDir,
        };
    }
    async dispose() {
        await rm(this.rootDir, { recursive: true, force: true });
    }
}
export class BorrowedRunTaskWorkspace {
    runTaskPath;
    fallbackWorkspace;
    workspaceId = "borrowed-run-task-workspace";
    capabilities;
    constructor(runTaskPath, fallbackWorkspace) {
        this.runTaskPath = runTaskPath;
        this.fallbackWorkspace = fallbackWorkspace;
        this.capabilities = {
            workspaceId: this.workspaceId,
            supportsTempDir: fallbackWorkspace.capabilities.supportsTempDir,
            supportsExistingCheckout: true,
            supportsContainer: fallbackWorkspace.capabilities.supportsContainer,
        };
    }
    async create(input) {
        if (input.purpose === "run-task") {
            return { path: this.runTaskPath };
        }
        return this.fallbackWorkspace.create(input);
    }
}
//# sourceMappingURL=temp-workspace.js.map