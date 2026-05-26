import type { SafeError } from "@agent-teams-control-plane/shared";

export type PublicErrorBody = Readonly<{
  code: string;
  message: string;
  category: SafeError["category"];
  retryable: boolean;
  correlationId: string;
  safeDetails?: SafeError["safeDetails"];
}>;

export type PublicErrorResponse = Readonly<{
  error: PublicErrorBody;
}>;

export function createPublicErrorResponse(input: {
  safeError: SafeError;
  correlationId: string;
}): PublicErrorResponse {
  const error = {
    category: input.safeError.category,
    code: input.safeError.code,
    correlationId: input.correlationId,
    message: input.safeError.message,
    retryable: input.safeError.retryable,
    ...(input.safeError.safeDetails === undefined
      ? {}
      : { safeDetails: input.safeError.safeDetails }),
  };

  return { error };
}

export function getHttpStatusForSafeError(safeError: SafeError): number {
  if (safeError.category === "validation") {
    return 400;
  }
  if (safeError.category === "authorization") {
    return 403;
  }
  if (safeError.category === "not-found") {
    return 404;
  }
  if (safeError.category === "conflict") {
    return 409;
  }
  if (safeError.category === "external") {
    return safeError.retryable ? 503 : 502;
  }
  return 500;
}
