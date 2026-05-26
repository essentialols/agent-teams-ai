#!/usr/bin/env node

if (!process.env.CONTROL_PLANE_TEST_DATABASE_URL) {
  throw new Error(
    "CONTROL_PLANE_TEST_DATABASE_URL is required for DB integration tests.",
  );
}

console.log("DB integration test environment is configured");
