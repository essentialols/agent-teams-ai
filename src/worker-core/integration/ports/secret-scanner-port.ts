import type { SecretScanStatus } from "../domain/integration-attempt";

export type SecretScanResult = {
  readonly status: SecretScanStatus;
  readonly safeMessage?: string;
};

export interface SecretScannerPort {
  scanFiles(input: {
    readonly workspacePath: string;
    readonly files: readonly string[];
  }): Promise<SecretScanResult> | SecretScanResult;
}
