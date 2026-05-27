import type { HostedIntegrationSafeErrorDto } from '../../contracts';

export function hostedIntegrationError(
  code: string,
  message: string,
  category: HostedIntegrationSafeErrorDto['category'] = 'validation',
  safeDetails?: HostedIntegrationSafeErrorDto['safeDetails']
): HostedIntegrationSafeErrorDto {
  return {
    category,
    code,
    message,
    ...(safeDetails === undefined ? {} : { safeDetails }),
  };
}

export function throwHostedIntegrationError(error: HostedIntegrationSafeErrorDto): never {
  throw new HostedIntegrationDomainError(error);
}

export class HostedIntegrationDomainError extends Error {
  public readonly safeError: HostedIntegrationSafeErrorDto;

  public constructor(safeError: HostedIntegrationSafeErrorDto) {
    super(safeError.message);
    this.name = 'HostedIntegrationDomainError';
    this.safeError = safeError;
  }
}
