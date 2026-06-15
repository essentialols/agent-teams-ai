import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  WorkspaceHandle,
  WorkspacePort,
} from "@vioxen/subscription-runtime/core";

export class TempWorkspace implements WorkspacePort {
  readonly workspaceId = "temp-workspace";
  readonly capabilities = {
    workspaceId: this.workspaceId,
    supportsTempDir: true,
    supportsExistingCheckout: true,
    supportsContainer: false,
  };

  constructor(private readonly prefix = "subscription-runtime-worker-") {}

  async create(): Promise<WorkspaceHandle> {
    const path = await mkdtemp(join(tmpdir(), this.prefix));
    return {
      path,
      dispose: () => rm(path, { recursive: true, force: true }),
    };
  }
}

export class StableWorkerWorkspace implements WorkspacePort {
  readonly workspaceId = "stable-worker-workspace";
  readonly capabilities = {
    workspaceId: this.workspaceId,
    supportsTempDir: true,
    supportsExistingCheckout: true,
    supportsContainer: false,
  };

  constructor(private readonly rootDir: string) {}

  async create(): Promise<WorkspaceHandle> {
    await mkdir(this.rootDir, { recursive: true, mode: 0o700 });
    return {
      path: this.rootDir,
    };
  }

  async dispose(): Promise<void> {
    await rm(this.rootDir, { recursive: true, force: true });
  }
}

export class BorrowedRunTaskWorkspace implements WorkspacePort {
  readonly workspaceId = "borrowed-run-task-workspace";
  readonly capabilities: WorkspacePort["capabilities"];

  constructor(
    private readonly runTaskPath: string,
    private readonly fallbackWorkspace: WorkspacePort,
  ) {
    this.capabilities = {
      workspaceId: this.workspaceId,
      supportsTempDir: fallbackWorkspace.capabilities.supportsTempDir,
      supportsExistingCheckout: true,
      supportsContainer: fallbackWorkspace.capabilities.supportsContainer,
    };
  }

  async create(input: {
    readonly purpose: "refresh" | "run-task";
    readonly isolation: "temp-dir" | "existing-checkout" | "container";
  }): Promise<WorkspaceHandle> {
    if (input.purpose === "run-task") {
      return { path: this.runTaskPath };
    }
    return this.fallbackWorkspace.create(input);
  }
}
