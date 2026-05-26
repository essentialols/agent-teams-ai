import { createSafeError } from "@agent-teams-control-plane/shared";

export type DesktopAuthRequestLike = Readonly<{
  headers?: Readonly<Record<string, unknown>>;
  query?: Readonly<Record<string, unknown>>;
  url?: string;
}>;

export function extractDesktopBearerToken(
  request: DesktopAuthRequestLike,
): string | undefined {
  rejectQueryToken(request);
  const raw =
    request.headers?.authorization ?? request.headers?.Authorization ?? undefined;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  if (!normalized.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }
  const token = normalized.slice("bearer ".length).trim();
  return token.length === 0 ? undefined : token;
}

function rejectQueryToken(request: DesktopAuthRequestLike): void {
  if (
    hasQueryTokenKey(request.query) ||
    request.url?.includes("desktopToken=") === true ||
    request.url?.includes("token=") === true
  ) {
    throw createSafeError({
      category: "authorization",
      code: "CONTROL_PLANE_DESKTOP_TOKEN_IN_QUERY_FORBIDDEN",
      message: "Desktop tokens must use the Authorization header.",
    });
  }
}

function hasQueryTokenKey(query: Readonly<Record<string, unknown>> | undefined): boolean {
  if (query === undefined) {
    return false;
  }
  return Object.keys(query).some((key) => key === "token" || key === "desktopToken");
}
