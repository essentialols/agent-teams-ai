export {
  registerTerminalPlatformIntegrationSampleIpc,
  removeTerminalPlatformIntegrationSampleIpc,
} from './adapters/input/ipc/registerTerminalPlatformIntegrationSampleIpc';
export {
  createTerminalPlatformIntegrationSampleFeature,
  type TerminalPlatformIntegrationSampleFeatureFacade,
} from './composition/createTerminalPlatformIntegrationSampleFeature';
export {
  buildTerminalPlatformDaemonArgs,
  TerminalPlatformSidecarSupervisor,
} from './infrastructure/TerminalPlatformSidecarSupervisor';
