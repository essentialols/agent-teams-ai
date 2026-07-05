import type { TargetRevision } from "../domain/base-revision";
import type { RevisionReaderPort } from "../ports/revision-reader-port";

export class ReadTargetRevisionUseCase {
  constructor(private readonly revisionReader: RevisionReaderPort) {}

  async read(input: { readonly workspacePath: string }): Promise<TargetRevision> {
    const result = await this.revisionReader.readHeadCommit(input);
    return result.commit === undefined ? {} : { commit: result.commit };
  }
}

export async function readTargetRevision(
  revisionReader: RevisionReaderPort,
  input: { readonly workspacePath: string },
): Promise<TargetRevision> {
  return new ReadTargetRevisionUseCase(revisionReader).read(input);
}
