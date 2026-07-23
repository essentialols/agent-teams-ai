/**
 * OmniRoute runtime provider.
 *
 * OmniRoute is the user's LOCAL model router (the `:20128` daemon). It is NOT a
 * coding CLI: it exposes an Anthropic-compatible HTTP ingress at
 * {@link OMNIROUTE_BASE_URL} (`/v1/messages`) that translates Anthropic wire
 * calls to the locally-served model. The `omniroute` provider therefore reuses
 * the Claude Code (`anthropic`) runtime and pins it at OmniRoute's endpoint,
 * exactly like the user's `www` launcher (`~/.local/bin/www` + `~/.claude-www/
 * www.env`) does.
 *
 * The constants below are extracted verbatim from that `www.env` file so an
 * `omniroute` team member launches with the same routing/telemetry env the user
 * already runs interactively. If OmniRoute is reconfigured to a different port
 * or default model, only this module needs to change.
 */

/** OmniRoute's Anthropic-compatible ingress. From `www.env` ANTHROPIC_BASE_URL. */
export const OMNIROUTE_BASE_URL = 'http://localhost:20128';

/**
 * Placeholder auth token. OmniRoute's localhost ingress requires no real key;
 * a non-empty value keeps Claude Code from prompting for a cloud login.
 * From `www.env` ANTHROPIC_AUTH_TOKEN.
 */
export const OMNIROUTE_LOCAL_AUTH_TOKEN = 'local-omniroute-no-cloud';

/**
 * Default model id routed through OmniRoute. `m2/ornith-35b-c` is the local
 * Ornith-35B model on the M2 node. From `www.env` ANTHROPIC_MODEL.
 */
export const OMNIROUTE_DEFAULT_MODEL = 'm2/ornith-35b-c';

/** UI display name for the provider tile/list. */
export const OMNIROUTE_DISPLAY_NAME = 'OmniRoute (local)';

/**
 * Pin an env map at OmniRoute's Anthropic-compatible endpoint. Mirrors the
 * env `~/.claude-www/www.env` exports so an `omniroute` runtime routes 100%
 * locally with no cloud phone-home. Caller is responsible for the
 * `CLAUDE_CODE_ENTRY_PROVIDER` / connection-mode markers (see
 * `applyProviderRuntimeEnv`).
 */
export function applyOmniRouteRuntimeEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  env.ANTHROPIC_BASE_URL = OMNIROUTE_BASE_URL;
  env.ANTHROPIC_AUTH_TOKEN = OMNIROUTE_LOCAL_AUTH_TOKEN;
  env.ANTHROPIC_API_KEY = OMNIROUTE_LOCAL_AUTH_TOKEN;

  env.ANTHROPIC_MODEL = OMNIROUTE_DEFAULT_MODEL;
  env.ANTHROPIC_SMALL_FAST_MODEL = OMNIROUTE_DEFAULT_MODEL;
  env.ANTHROPIC_DEFAULT_HAIKU_MODEL = OMNIROUTE_DEFAULT_MODEL;
  env.ANTHROPIC_DEFAULT_SONNET_MODEL = OMNIROUTE_DEFAULT_MODEL;
  env.ANTHROPIC_DEFAULT_OPUS_MODEL = OMNIROUTE_DEFAULT_MODEL;

  // Zero telemetry / no cloud phone-home. Local gateway auth, not Anthropic.
  env.DISABLE_TELEMETRY = '1';
  env.DISABLE_ERROR_REPORTING = '1';
  env.DISABLE_NON_ESSENTIAL_MODEL_CALLS = '1';
  env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
  env.CLAUDE_CODE_SKIP_AUTH = '1';

  return env;
}
