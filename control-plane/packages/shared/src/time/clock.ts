import type { Brand } from "../ids/brand.js";

export type UnixMilliseconds = number & Brand<"UnixMilliseconds">;

export interface Clock {
  now(): Date;
  nowMs(): UnixMilliseconds;
}

export class SystemClock implements Clock {
  public now(): Date {
    return new Date();
  }

  public nowMs(): UnixMilliseconds {
    return toUnixMilliseconds(Date.now());
  }
}

export class FixedClock implements Clock {
  private readonly timestampMs: UnixMilliseconds;

  public constructor(fixed: Date | UnixMilliseconds | number) {
    this.timestampMs =
      fixed instanceof Date
        ? toUnixMilliseconds(fixed.getTime())
        : toUnixMilliseconds(fixed);
  }

  public now(): Date {
    return new Date(this.timestampMs);
  }

  public nowMs(): UnixMilliseconds {
    return this.timestampMs;
  }
}

export function toUnixMilliseconds(value: number): UnixMilliseconds {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new RangeError("Unix milliseconds must be a finite integer.");
  }
  return value as UnixMilliseconds;
}

export function toIsoTimestamp(value: Date): string {
  if (!Number.isFinite(value.getTime())) {
    throw new RangeError("Invalid Date cannot be formatted as an ISO timestamp.");
  }
  return value.toISOString();
}
