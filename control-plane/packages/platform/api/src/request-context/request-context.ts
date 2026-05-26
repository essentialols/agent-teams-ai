import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import {
  SystemClock,
  type Clock,
  type UnixMilliseconds,
} from "@agent-teams-control-plane/shared";

export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";
export const REQUEST_CONTEXT_STORE = Symbol("REQUEST_CONTEXT_STORE");

const safeHeaderIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

export type RequestContext = Readonly<{
  requestId: string;
  correlationId: string;
  startedAtMs: UnixMilliseconds;
}>;

export interface RequestContextStore {
  current(): RequestContext | undefined;
  run<T>(context: RequestContext, callback: () => T): T;
}

export type IncomingHeaders = Readonly<Record<string, unknown>>;

export class AsyncLocalRequestContextStore implements RequestContextStore {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  public current(): RequestContext | undefined {
    return this.storage.getStore();
  }

  public run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }
}

export function createRequestContext(input: {
  headers?: IncomingHeaders;
  clock?: Clock;
}): RequestContext {
  const headers = input.headers ?? {};
  const clock = input.clock ?? new SystemClock();
  const correlationId = getHeaderValue(headers, CORRELATION_ID_HEADER) ?? randomUUID();
  const requestId = getHeaderValue(headers, REQUEST_ID_HEADER) ?? randomUUID();

  return {
    correlationId,
    requestId,
    startedAtMs: clock.nowMs(),
  };
}

export function getHeaderValue(
  headers: IncomingHeaders,
  name: string,
): string | undefined {
  const rawValue = headers[name] ?? headers[name.toLowerCase()];
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return isSafeHeaderId(normalized) ? normalized : undefined;
}

export function isSafeHeaderId(value: string): boolean {
  return safeHeaderIdPattern.test(value);
}
