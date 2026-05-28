import { mkdir, readFile, rm } from 'node:fs/promises';
import { dirname } from 'node:path';

import { atomicWriteAsync } from '@main/utils/atomicWrite';
import { safeStorage } from 'electron';

import { hostedIntegrationError, throwHostedIntegrationError } from '../../core/domain';

import type { DesktopSecureTokenStorePort } from '../../core/application';

interface StoredDesktopToken {
  readonly encryptionMethod: 'safeStorage';
  readonly encryptedToken: string;
  readonly updatedAt: string;
}

export class ElectronSafeStorageDesktopTokenStore implements DesktopSecureTokenStorePort {
  public constructor(private readonly filePath: string) {}

  public async isAvailable(): Promise<boolean> {
    return isSecureSafeStorageAvailable();
  }

  public async readToken(): Promise<string | null> {
    if (!(await this.isAvailable())) {
      return null;
    }
    let stored: StoredDesktopToken;
    try {
      stored = JSON.parse(await readFile(this.filePath, 'utf8')) as StoredDesktopToken;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
    if (stored.encryptionMethod !== 'safeStorage' || !stored.encryptedToken) {
      return null;
    }
    return safeStorage.decryptString(Buffer.from(stored.encryptedToken, 'base64'));
  }

  public async writeToken(token: string): Promise<void> {
    if (!(await this.isAvailable())) {
      throwHostedIntegrationError(
        hostedIntegrationError(
          'HOSTED_INTEGRATION_SECURE_STORE_UNAVAILABLE',
          'Secure local credential storage is unavailable.',
          'security'
        )
      );
    }
    const encryptedToken = safeStorage.encryptString(token).toString('base64');
    const stored: StoredDesktopToken = {
      encryptionMethod: 'safeStorage',
      encryptedToken,
      updatedAt: new Date().toISOString(),
    };
    await mkdir(dirname(this.filePath), { recursive: true });
    await atomicWriteAsync(this.filePath, `${JSON.stringify(stored, null, 2)}\n`);
  }

  public async clearToken(): Promise<void> {
    await rm(this.filePath, { force: true });
  }
}

function isSecureSafeStorageAvailable(): boolean {
  try {
    if (!safeStorage.isEncryptionAvailable()) return false;
    if (process.platform === 'linux') {
      const backend = safeStorage.getSelectedStorageBackend();
      return backend !== 'basic_text' && backend !== 'unknown';
    }
    return true;
  } catch {
    return false;
  }
}
