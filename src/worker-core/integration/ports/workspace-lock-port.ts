export type WorkspaceLock = {
  readonly lockId: string;
  readonly workspacePath: string;
  readonly owner: string;
};

export interface WorkspaceLockPort {
  acquire(input: {
    readonly workspacePath: string;
    readonly owner: string;
  }): Promise<WorkspaceLock> | WorkspaceLock;

  release(lock: WorkspaceLock): Promise<void> | void;
}
