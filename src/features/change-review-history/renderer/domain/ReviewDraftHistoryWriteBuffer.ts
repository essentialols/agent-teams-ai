/**
 * Coalesces the newest draft while preserving an unacknowledged predecessor exactly.
 * The predecessor must be retried first because its IPC reply may have been lost after commit.
 */
export class ReviewDraftHistoryWriteBuffer<T> {
  private readonly pending = new Map<string, T>();
  private readonly failed = new Map<string, T>();

  enqueue(key: string, value: T): void {
    this.pending.set(key, value);
  }

  takeNext(key: string): T | undefined {
    const failed = this.failed.get(key);
    if (failed !== undefined) {
      this.failed.delete(key);
      return failed;
    }
    const pending = this.pending.get(key);
    if (pending !== undefined) this.pending.delete(key);
    return pending;
  }

  markFailed(key: string, value: T): void {
    this.failed.set(key, value);
  }

  keys(prefix: string): string[] {
    return [...new Set([...this.pending.keys(), ...this.failed.keys()])].filter((key) =>
      key.startsWith(prefix)
    );
  }

  hasPending(key: string): boolean {
    return this.pending.has(key);
  }

  hasPendingWithPrefix(prefix: string): boolean {
    return [...this.pending.keys()].some((key) => key.startsWith(prefix));
  }

  hasFailedWithPrefix(prefix: string): boolean {
    return [...this.failed.keys()].some((key) => key.startsWith(prefix));
  }
}
