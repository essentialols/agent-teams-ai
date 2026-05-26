import { err, ok, type Result } from "../result/result.js";

export type ValidationIssue = Readonly<{
  code: string;
  message: string;
  path: readonly string[];
}>;

export type ValidationResult<T> = Result<T, readonly ValidationIssue[]>;

export function validationOk<T>(value: T): ValidationResult<T> {
  return ok(value);
}

export function validationFailed(
  issues: ValidationIssue | readonly ValidationIssue[],
): ValidationResult<never> {
  return err(Array.isArray(issues) ? issues : [issues]);
}
