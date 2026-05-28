import { shell } from 'electron';

import type { DesktopBrowserOpenPort } from '../../core/application';

export class ElectronBrowserOpenPort implements DesktopBrowserOpenPort {
  public async openExternal(url: URL): Promise<void> {
    await shell.openExternal(url.href);
  }
}
