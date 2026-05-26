export type HttpRequestLike = Readonly<{
  headers?: Readonly<Record<string, unknown>>;
  method?: string;
  url?: string;
}>;

export type HttpResponseLike = {
  statusCode?: number;
  header?(name: string, value: string): unknown;
  setHeader?(name: string, value: string): unknown;
  status?(statusCode: number): HttpResponseLike;
  code?(statusCode: number): HttpResponseLike;
  send?(body: unknown): unknown;
};

export function setResponseHeader(
  response: HttpResponseLike,
  name: string,
  value: string,
): void {
  if (typeof response.header === "function") {
    response.header(name, value);
    return;
  }
  response.setHeader?.(name, value);
}

export function sendJsonResponse(
  response: HttpResponseLike,
  statusCode: number,
  body: unknown,
): void {
  if (typeof response.status === "function") {
    response.status(statusCode);
  } else if (typeof response.code === "function") {
    response.code(statusCode);
  }
  response.send?.(body);
}

export function sanitizeRequestPath(url: string | undefined): string {
  if (url === undefined || url.length === 0) {
    return "/";
  }

  const path = url.split("?")[0] ?? "/";
  return path.slice(0, 256);
}
