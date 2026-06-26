import { app } from 'electron';

import { applyElectronDevPathOverrides } from './utils/electronDevPathOverrides';
import { migrateElectronUserDataDirectory } from './utils/electronUserDataMigration';

export const earlyElectronDevPathOverrideResult = applyElectronDevPathOverrides(app);
export const earlyElectronUserDataMigrationResult = migrateElectronUserDataDirectory(app);
