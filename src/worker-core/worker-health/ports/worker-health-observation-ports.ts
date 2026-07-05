export type ProcessObservationPort = {
  isProcessAlive(input: { readonly runId: string }): Promise<boolean | undefined>;
};

export type ProgressObservationPort = {
  readProgress(input: {
    readonly runId: string;
  }): Promise<{
    readonly status?: string;
    readonly heartbeatAgeMs?: number;
    readonly staleAfterMs?: number;
  }>;
};

export type WorkspaceObservationPort = {
  readWorkspace(input: {
    readonly runId: string;
  }): Promise<{
    readonly dirty?: boolean;
    readonly changedFilesCount?: number;
  }>;
};

export type ControlInboxObservationPort = {
  readControlInbox(input: {
    readonly runId: string;
  }): Promise<{
    readonly pendingCount?: number;
    readonly safeToContinue?: boolean;
  }>;
};
