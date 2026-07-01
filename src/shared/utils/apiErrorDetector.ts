const API_ERROR_PATTERNS = [
  /^API Error:\s*\d{3}/i,
  /\byou're out of extra usage\b/i,
  /\brate[_\s-]?limit(?:ed)?\b/i,
  /\bquota (?:exhausted|exceeded)\b/i,
];

/**
 * Returns true for provider/API failures that should render as error output.
 */
export function isApiErrorMessage(text: string): boolean {
  return API_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}
