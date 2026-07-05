export type RevisionReadResult = {
  readonly commit?: string;
  readonly reason?: string;
};

export interface RevisionReaderPort {
  readHeadCommit(input: {
    readonly workspacePath: string;
  }): Promise<RevisionReadResult>;
}
