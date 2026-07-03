import {
  buildLeadMessageStdinPayload as defaultBuildLeadMessageStdinPayload,
  type BuildLeadMessageStdinPayloadInput,
  type LeadAttachmentInput,
  toLeadAttachmentPayloads as defaultToLeadAttachmentPayloads,
} from './TeamProvisioningLeadAttachments';

export interface TeamProvisioningSendMessageToRunWritableStdin {
  writable: boolean;
  write(chunk: string, callback: (error?: Error | null) => void): unknown;
}

export interface TeamProvisioningSendMessageToRunRun {
  teamName: string;
  runId: string;
  processKilled: boolean;
  cancelRequested: boolean;
  request: {
    providerId?: unknown;
  };
  child: {
    stdin?: TeamProvisioningSendMessageToRunWritableStdin | null;
  } | null;
}

export interface TeamProvisioningSendMessageToRunBoundaryDeps<
  TRun extends TeamProvisioningSendMessageToRunRun,
> {
  isCurrentTrackedRun(run: TRun): boolean;
  setLeadActivity(run: TRun, state: 'active'): void;
  toLeadAttachmentPayloads?: typeof defaultToLeadAttachmentPayloads;
  buildLeadMessageStdinPayload?: (input: BuildLeadMessageStdinPayloadInput) => Promise<string>;
}

export interface TeamProvisioningSendMessageToRunBoundary<
  TRun extends TeamProvisioningSendMessageToRunRun,
> {
  sendMessageToRun(
    run: TRun,
    message: string,
    attachments?: readonly LeadAttachmentInput[]
  ): Promise<void>;
}

export function createTeamProvisioningSendMessageToRunBoundary<
  TRun extends TeamProvisioningSendMessageToRunRun,
>(
  deps: TeamProvisioningSendMessageToRunBoundaryDeps<TRun>
): TeamProvisioningSendMessageToRunBoundary<TRun> {
  const toLeadAttachmentPayloads = deps.toLeadAttachmentPayloads ?? defaultToLeadAttachmentPayloads;
  const buildLeadMessageStdinPayload =
    deps.buildLeadMessageStdinPayload ?? defaultBuildLeadMessageStdinPayload;

  return {
    async sendMessageToRun(
      run: TRun,
      message: string,
      attachments?: readonly LeadAttachmentInput[]
    ): Promise<void> {
      if (!deps.isCurrentTrackedRun(run)) {
        throw new Error(`Team "${run.teamName}" run "${run.runId}" is no longer current`);
      }
      if (run.processKilled || run.cancelRequested || !run.child?.stdin?.writable) {
        throw new Error(`Team "${run.teamName}" process stdin is not writable`);
      }

      const attachmentPayloads = toLeadAttachmentPayloads(attachments);
      const payload = await buildLeadMessageStdinPayload({
        teamName: run.teamName,
        runId: run.runId,
        providerId: run.request.providerId,
        text: message,
        attachments: attachmentPayloads,
      });
      const stdin = run.child.stdin;
      await new Promise<void>((resolve, reject) => {
        stdin.write(payload + '\n', (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      deps.setLeadActivity(run, 'active');
    },
  };
}
