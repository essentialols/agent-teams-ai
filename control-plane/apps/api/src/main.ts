import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";

import { ControlPlaneConfigService } from "@agent-teams-control-plane/platform-config";
import {
  CONTROL_PLANE_LOGGER,
  type ControlPlaneLogger,
} from "@agent-teams-control-plane/platform-logger";

import { ApiAppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    ApiAppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.enableShutdownHooks();

  const config = app.get(ControlPlaneConfigService, { strict: false }).getConfig();
  const logger = app
    .get<ControlPlaneLogger>(CONTROL_PLANE_LOGGER, { strict: false })
    .child("api");

  await app.listen(config.http.port, config.http.host);

  logger.info("API listening", {
    host: config.http.host,
    mode: config.mode,
    port: config.http.port,
  });
}

await bootstrap();
