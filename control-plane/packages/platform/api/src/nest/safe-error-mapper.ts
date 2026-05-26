import { HttpException } from "@nestjs/common";

import {
  createSafeError,
  isSafeError,
  toSafeError,
  type SafeError,
} from "@agent-teams-control-plane/shared";

export function toApiSafeError(exception: unknown): SafeError {
  const embeddedSafeError = getEmbeddedSafeError(exception);
  if (embeddedSafeError !== undefined) {
    return toSafeError(embeddedSafeError);
  }

  if (exception instanceof HttpException) {
    return createSafeError({
      category: getCategoryForHttpStatus(exception.getStatus()),
      code: getCodeForHttpStatus(exception.getStatus()),
      message: getMessageForHttpStatus(exception.getStatus()),
      retryable: isRetryableHttpStatus(exception.getStatus()),
    });
  }

  return toSafeError(exception);
}

export function getHttpStatusForException(exception: unknown): number | undefined {
  return exception instanceof HttpException ? exception.getStatus() : undefined;
}

function getEmbeddedSafeError(exception: unknown): SafeError | undefined {
  if (isSafeError(exception)) {
    return exception;
  }
  if (
    typeof exception === "object" &&
    exception !== null &&
    "safeError" in exception &&
    isSafeError(exception.safeError)
  ) {
    return exception.safeError;
  }
  return undefined;
}

function getCategoryForHttpStatus(statusCode: number): SafeError["category"] {
  if (statusCode === 400 || statusCode === 422) {
    return "validation";
  }
  if (statusCode === 401 || statusCode === 403) {
    return "authorization";
  }
  if (statusCode === 404) {
    return "not-found";
  }
  if (statusCode === 409) {
    return "conflict";
  }
  if (statusCode >= 500) {
    return "internal";
  }
  return "validation";
}

function getCodeForHttpStatus(statusCode: number): string {
  if (statusCode === 400 || statusCode === 422) {
    return "CONTROL_PLANE_INVALID_REQUEST";
  }
  if (statusCode === 401) {
    return "CONTROL_PLANE_AUTHENTICATION_REQUIRED";
  }
  if (statusCode === 403) {
    return "CONTROL_PLANE_FORBIDDEN";
  }
  if (statusCode === 404) {
    return "CONTROL_PLANE_ROUTE_NOT_FOUND";
  }
  if (statusCode === 409) {
    return "CONTROL_PLANE_CONFLICT";
  }
  return "CONTROL_PLANE_HTTP_ERROR";
}

function getMessageForHttpStatus(statusCode: number): string {
  if (statusCode === 400 || statusCode === 422) {
    return "Invalid request.";
  }
  if (statusCode === 401) {
    return "Authentication is required.";
  }
  if (statusCode === 403) {
    return "Request is not authorized.";
  }
  if (statusCode === 404) {
    return "Route not found.";
  }
  if (statusCode === 409) {
    return "Request conflicts with current state.";
  }
  return "HTTP request failed.";
}

function isRetryableHttpStatus(statusCode: number): boolean {
  return statusCode === 429 || statusCode >= 500;
}
