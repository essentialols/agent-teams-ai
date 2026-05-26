#!/usr/bin/env node
import { spawn } from "node:child_process";

const requiredHostedKeys = [
  "CONTROL_PLANE_PUBLIC_BASE_URL",
  "CONTROL_PLANE_GITHUB_APP_ID",
  "CONTROL_PLANE_GITHUB_APP_SLUG",
  "CONTROL_PLANE_GITHUB_REST_API_VERSION",
  "CONTROL_PLANE_GITHUB_PRIVATE_KEY",
  "CONTROL_PLANE_GITHUB_WEBHOOK_SECRET",
  "CONTROL_PLANE_GITHUB_OAUTH_CLIENT_ID",
  "CONTROL_PLANE_GITHUB_OAUTH_CLIENT_SECRET",
];

const env = {
  ...process.env,
  CONTROL_PLANE_MODE: "hosted-official-app",
  CONTROL_PLANE_WORKER_SMOKE: "1",
  NODE_ENV: "test",
};

for (const key of requiredHostedKeys) {
  delete env[key];
}

const { exitCode, output } = await runWorkerSmoke(env);

if (exitCode === 0) {
  throw new Error("Hosted mode unexpectedly booted without required GitHub config");
}
if (!output.includes("ControlPlaneConfigError")) {
  throw new Error(`Hosted mode failed for the wrong reason:\n${output}`);
}

for (const key of requiredHostedKeys) {
  if (!output.includes(`${key} is required`)) {
    throw new Error(`Hosted fail-fast output did not mention ${key}:\n${output}`);
  }
}

console.log("Hosted config fail-fast smoke passed");

async function runWorkerSmoke(env) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const child = spawn("tsx", ["apps/worker/src/main.ts"], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk) => chunks.push(String(chunk)));
    child.stderr.on("data", (chunk) => chunks.push(String(chunk)));
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      resolve({
        exitCode: code ?? signal,
        output: chunks.join(""),
      }),
    );
  });
}
