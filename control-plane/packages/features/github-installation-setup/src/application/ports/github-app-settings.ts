export interface GitHubAppSetupSettings {
  requireSetupSettings(): {
    appSlug: string;
    publicBaseUrl: string;
  };
  requireOAuthSettings(): {
    clientId: string;
    clientSecret: string;
    publicBaseUrl: string;
  };
  restApiVersion(): string | undefined;
}
