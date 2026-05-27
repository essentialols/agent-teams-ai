import type {
  LoadExternalActionContentUseCase,
  ShredExternalActionContentUseCase,
  StoreExternalActionContentUseCase,
} from "@agent-teams-control-plane/features-external-action-content";

import type { GitHubActionContentStore } from "../../application/ports/github-action-content-store.port.js";

export class ExternalActionContentStoreAdapter implements GitHubActionContentStore {
  public constructor(
    private readonly storeContent: StoreExternalActionContentUseCase,
    private readonly loadContent: LoadExternalActionContentUseCase,
    private readonly shredContent: ShredExternalActionContentUseCase,
  ) {}

  public async store(
    input: Parameters<GitHubActionContentStore["store"]>[0],
  ): ReturnType<GitHubActionContentStore["store"]> {
    return this.storeContent.execute({
      context: input.context,
      expiresAt: input.expiresAt,
      id: input.id,
      kind: "github-action-payload",
      plaintext: input.plaintext,
    });
  }

  public async load(
    input: Parameters<GitHubActionContentStore["load"]>[0],
  ): ReturnType<GitHubActionContentStore["load"]> {
    return this.loadContent.execute(input.ref);
  }

  public async shred(
    input: Parameters<GitHubActionContentStore["shred"]>[0],
  ): ReturnType<GitHubActionContentStore["shred"]> {
    await this.shredContent.execute(input);
  }
}
