import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";

import { CompositeOutboxHandlerRegistry } from "@agent-teams-control-plane/features-outbox/interface/nest";

import {
  GITHUB_ACTION_DISPATCH_EVENT_TYPE,
  GITHUB_ACTION_DISPATCH_EVENT_VERSION,
} from "../../application/ports/github-action-outbox.port.js";
import { GitHubActionDispatchHandler } from "../../infrastructure/outbox/github-action-dispatch.handler.js";

@Injectable()
export class GitHubActionOutboxRegistrar implements OnModuleInit {
  public constructor(
    @Inject(CompositeOutboxHandlerRegistry)
    private readonly registry: CompositeOutboxHandlerRegistry,
    @Inject(GitHubActionDispatchHandler)
    private readonly handler: GitHubActionDispatchHandler,
  ) {}

  public onModuleInit(): void {
    this.registry.register({
      eventType: GITHUB_ACTION_DISPATCH_EVENT_TYPE,
      eventVersion: GITHUB_ACTION_DISPATCH_EVENT_VERSION,
      handler: this.handler,
    });
  }
}
