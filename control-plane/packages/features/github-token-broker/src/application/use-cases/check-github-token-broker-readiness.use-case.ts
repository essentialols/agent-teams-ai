import type { GitHubAppJwtSigner } from "../ports/github-app-jwt-signer.port.js";
import type {
  GitHubTokenBrokerFeatureGatePolicy,
  GitHubTokenBrokerSettings,
} from "../ports/policies.js";

export type GitHubTokenBrokerReadinessCheck = Readonly<{
  name: string;
  status: "pass" | "fail";
  safeErrorCode?: string;
}>;

export type GitHubTokenBrokerReadinessReport = Readonly<{
  status: "ready" | "not_ready";
  checks: readonly GitHubTokenBrokerReadinessCheck[];
}>;

export class CheckGitHubTokenBrokerReadinessUseCase {
  public constructor(
    private readonly featureGate: GitHubTokenBrokerFeatureGatePolicy,
    private readonly settings: GitHubTokenBrokerSettings,
    private readonly signer: GitHubAppJwtSigner,
  ) {}

  public async execute(): Promise<GitHubTokenBrokerReadinessReport> {
    const snapshot = this.settings.readinessSnapshot();
    const signerReadiness = await this.signer.checkReadiness();
    const checks: GitHubTokenBrokerReadinessCheck[] = [
      booleanCheck(
        "feature_gate",
        this.featureGate.isEnabled("github-token-broker"),
        "CONTROL_PLANE_FEATURE_DISABLED",
      ),
      booleanCheck(
        "hosted_mode",
        snapshot.mode !== "local-disabled",
        "CONTROL_PLANE_GITHUB_TOKEN_BROKER_HOSTED_MODE_REQUIRED",
      ),
      booleanCheck(
        "public_base_url",
        snapshot.publicBaseUrlConfigured,
        "CONTROL_PLANE_GITHUB_PUBLIC_BASE_URL_MISSING",
      ),
      booleanCheck(
        "app_id",
        snapshot.appIdConfigured,
        "CONTROL_PLANE_GITHUB_APP_ID_MISSING",
      ),
      booleanCheck(
        "app_slug",
        snapshot.appSlugConfigured,
        "CONTROL_PLANE_GITHUB_APP_SLUG_MISSING",
      ),
      booleanCheck(
        "rest_api_version",
        snapshot.restApiVersionConfigured,
        "CONTROL_PLANE_GITHUB_REST_API_VERSION_MISSING",
      ),
      booleanCheck(
        "private_key_configured",
        signerReadiness.privateKeyConfigured,
        "CONTROL_PLANE_GITHUB_PRIVATE_KEY_MISSING",
      ),
      booleanCheck(
        "private_key_parseable",
        signerReadiness.privateKeyParseable,
        signerReadiness.safeErrorCode ?? "CONTROL_PLANE_GITHUB_PRIVATE_KEY_INVALID",
      ),
    ];
    return {
      checks,
      status: checks.every((check) => check.status === "pass") ? "ready" : "not_ready",
    };
  }
}

function booleanCheck(
  name: string,
  passed: boolean,
  safeErrorCode: string,
): GitHubTokenBrokerReadinessCheck {
  if (passed) {
    return { name, status: "pass" };
  }
  return { name, safeErrorCode, status: "fail" };
}
