export type TransientGitHubUserToken = Readonly<{
  accessToken: string;
  tokenType: string;
  scope?: string;
  refreshTokenReceived: boolean;
}>;

export interface GitHubUserTokenExchange {
  exchangeCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<TransientGitHubUserToken>;
}
