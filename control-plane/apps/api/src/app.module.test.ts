import "reflect-metadata";

import { Test } from "@nestjs/testing";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { describe, expect, it } from "vitest";

import { ApiAppModule } from "./app.module.js";

type InjectCapableFastify = Readonly<{
  ready(): PromiseLike<unknown>;
  inject(input: Readonly<{ method: string; url: string }>): Promise<{
    statusCode: number;
    json(): unknown;
  }>;
}>;

describe("ApiAppModule", () => {
  it("serves GET /health", async () => {
    const previousMode = process.env.CONTROL_PLANE_MODE;
    process.env.CONTROL_PLANE_MODE = "local-disabled";

    const moduleRef = await Test.createTestingModule({
      imports: [ApiAppModule],
    }).compile();
    const app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );

    try {
      await app.init();

      const fastify = app
        .getHttpAdapter()
        .getInstance() as unknown as InjectCapableFastify;
      await fastify.ready();
      const response = await fastify.inject({ method: "GET", url: "/health" });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        mode: "local-disabled",
        service: { name: "agent-teams-control-plane" },
        status: "ok",
      });
    } finally {
      if (previousMode === undefined) {
        delete process.env.CONTROL_PLANE_MODE;
      } else {
        process.env.CONTROL_PLANE_MODE = previousMode;
      }
      await app.close();
    }
  });
});
