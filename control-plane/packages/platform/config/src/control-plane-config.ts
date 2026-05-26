import { z } from "zod";

export const CONTROL_PLANE_MODES = [
  "local-disabled",
  "hosted-official-app",
  "self-hosted-byo-app",
] as const;

export type ControlPlaneMode = (typeof CONTROL_PLANE_MODES)[number];

export type ControlPlaneConfig = Readonly<{
  environment: "development" | "test" | "production";
  mode: ControlPlaneMode;
  http: Readonly<{
    host: string;
    port: number;
  }>;
  publicBaseUrl?: string;
  github: Readonly<{
    restApiVersion?: string;
    appId?: string;
    appSlug?: string;
    oauthClientId?: string;
  }>;
  secrets: Readonly<{
    githubPrivateKey?: string;
    githubWebhookSecret?: string;
    githubOAuthClientSecret?: string;
  }>;
}>;

export type SafeControlPlaneConfigSummary = Readonly<{
  environment: ControlPlaneConfig["environment"];
  mode: ControlPlaneMode;
  http: ControlPlaneConfig["http"];
  publicBaseUrlConfigured: boolean;
  github: Readonly<{
    restApiVersionConfigured: boolean;
    appIdConfigured: boolean;
    appSlugConfigured: boolean;
    oauthClientIdConfigured: boolean;
    privateKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
    oauthClientSecretConfigured: boolean;
  }>;
}>;

export class ControlPlaneConfigError extends Error {
  public readonly issues: readonly string[];

  public constructor(issues: readonly string[]) {
    super(`Invalid control-plane configuration: ${issues.join("; ")}`);
    this.name = "ControlPlaneConfigError";
    this.issues = issues;
  }
}

const rawConfigSchema = z.object({
  CONTROL_PLANE_GITHUB_APP_ID: z.string().min(1).optional(),
  CONTROL_PLANE_GITHUB_APP_SLUG: z.string().min(1).optional(),
  CONTROL_PLANE_GITHUB_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  CONTROL_PLANE_GITHUB_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  CONTROL_PLANE_GITHUB_PRIVATE_KEY: z.string().min(1).optional(),
  CONTROL_PLANE_GITHUB_REST_API_VERSION: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  CONTROL_PLANE_GITHUB_WEBHOOK_SECRET: z.string().min(1).optional(),
  CONTROL_PLANE_HTTP_HOST: z.string().min(1).default("127.0.0.1"),
  CONTROL_PLANE_HTTP_PORT: z.coerce.number().int().min(1).max(65535).default(3030),
  CONTROL_PLANE_MODE: z.enum(CONTROL_PLANE_MODES).default("local-disabled"),
  CONTROL_PLANE_PUBLIC_BASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type RawConfig = z.infer<typeof rawConfigSchema>;
type RawConfigKey = keyof RawConfig;

const hostedRequiredKeys = [
  "CONTROL_PLANE_PUBLIC_BASE_URL",
  "CONTROL_PLANE_GITHUB_APP_ID",
  "CONTROL_PLANE_GITHUB_APP_SLUG",
  "CONTROL_PLANE_GITHUB_REST_API_VERSION",
  "CONTROL_PLANE_GITHUB_PRIVATE_KEY",
  "CONTROL_PLANE_GITHUB_WEBHOOK_SECRET",
  "CONTROL_PLANE_GITHUB_OAUTH_CLIENT_ID",
  "CONTROL_PLANE_GITHUB_OAUTH_CLIENT_SECRET",
] as const satisfies readonly RawConfigKey[];

export function loadControlPlaneConfig(
  env: NodeJS.ProcessEnv = process.env,
): ControlPlaneConfig {
  const parsed = rawConfigSchema.safeParse(env);
  if (!parsed.success) {
    throw new ControlPlaneConfigError(
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    );
  }

  const raw = parsed.data;
  const missingKeys = getMissingHostedKeys(raw);
  if (missingKeys.length > 0) {
    throw new ControlPlaneConfigError(
      missingKeys.map(
        (key) => `${key} is required when CONTROL_PLANE_MODE=${raw.CONTROL_PLANE_MODE}`,
      ),
    );
  }

  const github = buildGitHubConfig(raw);
  const secrets = buildSecretConfig(raw);

  const configBase = {
    environment: raw.NODE_ENV,
    github,
    http: {
      host: raw.CONTROL_PLANE_HTTP_HOST,
      port: raw.CONTROL_PLANE_HTTP_PORT,
    },
    mode: raw.CONTROL_PLANE_MODE,
    secrets,
  };

  if (raw.CONTROL_PLANE_PUBLIC_BASE_URL === undefined) {
    return configBase;
  }

  return {
    ...configBase,
    publicBaseUrl: raw.CONTROL_PLANE_PUBLIC_BASE_URL,
  };
}

export function getSafeConfigSummary(
  config: ControlPlaneConfig,
): SafeControlPlaneConfigSummary {
  return {
    environment: config.environment,
    github: {
      appIdConfigured: config.github.appId !== undefined,
      appSlugConfigured: config.github.appSlug !== undefined,
      oauthClientIdConfigured: config.github.oauthClientId !== undefined,
      oauthClientSecretConfigured: config.secrets.githubOAuthClientSecret !== undefined,
      privateKeyConfigured: config.secrets.githubPrivateKey !== undefined,
      restApiVersionConfigured: config.github.restApiVersion !== undefined,
      webhookSecretConfigured: config.secrets.githubWebhookSecret !== undefined,
    },
    http: config.http,
    mode: config.mode,
    publicBaseUrlConfigured: config.publicBaseUrl !== undefined,
  };
}

function getMissingHostedKeys(raw: RawConfig): readonly RawConfigKey[] {
  if (raw.CONTROL_PLANE_MODE === "local-disabled") {
    return [];
  }
  return hostedRequiredKeys.filter((key) => !hasValue(raw[key]));
}

function hasValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined;
}

function buildGitHubConfig(raw: RawConfig): ControlPlaneConfig["github"] {
  const github: {
    restApiVersion?: string;
    appId?: string;
    appSlug?: string;
    oauthClientId?: string;
  } = {};

  if (raw.CONTROL_PLANE_GITHUB_REST_API_VERSION !== undefined) {
    github.restApiVersion = raw.CONTROL_PLANE_GITHUB_REST_API_VERSION;
  }
  if (raw.CONTROL_PLANE_GITHUB_APP_ID !== undefined) {
    github.appId = raw.CONTROL_PLANE_GITHUB_APP_ID;
  }
  if (raw.CONTROL_PLANE_GITHUB_APP_SLUG !== undefined) {
    github.appSlug = raw.CONTROL_PLANE_GITHUB_APP_SLUG;
  }
  if (raw.CONTROL_PLANE_GITHUB_OAUTH_CLIENT_ID !== undefined) {
    github.oauthClientId = raw.CONTROL_PLANE_GITHUB_OAUTH_CLIENT_ID;
  }

  return github;
}

function buildSecretConfig(raw: RawConfig): ControlPlaneConfig["secrets"] {
  const secrets: {
    githubPrivateKey?: string;
    githubWebhookSecret?: string;
    githubOAuthClientSecret?: string;
  } = {};

  if (raw.CONTROL_PLANE_GITHUB_PRIVATE_KEY !== undefined) {
    secrets.githubPrivateKey = raw.CONTROL_PLANE_GITHUB_PRIVATE_KEY;
  }
  if (raw.CONTROL_PLANE_GITHUB_WEBHOOK_SECRET !== undefined) {
    secrets.githubWebhookSecret = raw.CONTROL_PLANE_GITHUB_WEBHOOK_SECRET;
  }
  if (raw.CONTROL_PLANE_GITHUB_OAUTH_CLIENT_SECRET !== undefined) {
    secrets.githubOAuthClientSecret = raw.CONTROL_PLANE_GITHUB_OAUTH_CLIENT_SECRET;
  }

  return secrets;
}
