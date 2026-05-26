export type Ok<T> = Readonly<{
  ok: true;
  value: T;
}>;

export type Err<E> = Readonly<{
  ok: false;
  error: E;
}>;

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { error, ok: false };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

export function map<T, E, U>(
  result: Result<T, E>,
  mapper: (value: T) => U,
): Result<U, E> {
  return isOk(result) ? ok(mapper(result.value)) : result;
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  mapper: (error: E) => F,
): Result<T, F> {
  return isErr(result) ? err(mapper(result.error)) : result;
}

export function andThen<T, E, U>(
  result: Result<T, E>,
  next: (value: T) => Result<U, E>,
): Result<U, E> {
  return isOk(result) ? next(result.value) : result;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T | ((error: E) => T)): T {
  if (isOk(result)) {
    return result.value;
  }
  return typeof fallback === "function"
    ? (fallback as (error: E) => T)(result.error)
    : fallback;
}
