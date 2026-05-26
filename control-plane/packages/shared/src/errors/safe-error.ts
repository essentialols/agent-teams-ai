export type SafeErrorCode = string & {
  readonly __brand: "SafeErrorCode";
};

export type SafeErrorCategory =
  | "authorization"
  | "conflict"
  | "external"
  | "internal"
  | "not-found"
  | "validation";

export type SafeErrorDetailsValue = boolean | null | number | string;

export type SafeErrorDetails = Readonly<Record<string, SafeErrorDetailsValue>>;

export type SafeError = Readonly<{
  code: SafeErrorCode;
  message: string;
  category: SafeErrorCategory;
  retryable: boolean;
  safeDetails?: SafeErrorDetails;
}>;

export const CONTROL_PLANE_INTERNAL_ERROR =
  "CONTROL_PLANE_INTERNAL_ERROR" as SafeErrorCode;

export function createSafeError(input: {
  code: SafeErrorCode | string;
  message: string;
  category: SafeErrorCategory;
  retryable?: boolean;
  safeDetails?: SafeErrorDetails;
}): SafeError {
  if (input.safeDetails !== undefined && !isSafeErrorDetails(input.safeDetails)) {
    throw new TypeError("Safe error details must be a flat primitive record.");
  }

  return {
    category: input.category,
    code: input.code as SafeErrorCode,
    message: input.message,
    retryable: input.retryable ?? false,
    ...(input.safeDetails === undefined ? {} : { safeDetails: input.safeDetails }),
  };
}

export function isSafeError(value: unknown): value is SafeError {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    typeof value.retryable === "boolean" &&
    isSafeErrorCategory(value.category) &&
    (value.safeDetails === undefined || isSafeErrorDetails(value.safeDetails))
  );
}

export function toSafeError(value: unknown): SafeError {
  if (isSafeError(value)) {
    return createSafeError({
      category: value.category,
      code: value.code,
      message: value.message,
      retryable: value.retryable,
      ...(value.safeDetails === undefined ? {} : { safeDetails: value.safeDetails }),
    });
  }

  return createSafeError({
    category: "internal",
    code: CONTROL_PLANE_INTERNAL_ERROR,
    message: "Internal control-plane error.",
    retryable: false,
  });
}

function isSafeErrorCategory(value: unknown): value is SafeErrorCategory {
  return (
    value === "authorization" ||
    value === "conflict" ||
    value === "external" ||
    value === "internal" ||
    value === "not-found" ||
    value === "validation"
  );
}

function isSafeErrorDetails(value: unknown): value is SafeErrorDetails {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(isSafeErrorDetailsValue);
}

function isSafeErrorDetailsValue(value: unknown): value is SafeErrorDetailsValue {
  return (
    value === null ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
