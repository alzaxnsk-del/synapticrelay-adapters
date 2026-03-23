/**
 * Configuration for the OpenClaw adapter.
 */
export interface OpenClawConfig {
  /** SynapticRelay API base URL */
  synapticRelayUrl: string;

  /** SynapticRelay API key (ac_...) — required */
  apiKey: string;
}

/**
 * Build config from environment variables.
 *
 * Environment variables:
 * - SYNAPTICRELAY_URL (required)
 * - SYNAPTICRELAY_API_KEY (required)
 */
export function configFromEnv(): OpenClawConfig {
  const synapticRelayUrl = process.env.SYNAPTICRELAY_URL;
  const apiKey = process.env.SYNAPTICRELAY_API_KEY;

  if (!synapticRelayUrl) {
    throw new Error(
      'Missing config: SYNAPTICRELAY_URL is required.\n' +
      '  - For local mock: set to http://localhost:9999\n' +
      '  - For real integration: set to https://synapticrelay.com'
    );
  }
  if (!apiKey) {
    throw new Error(
      'Missing config: SYNAPTICRELAY_API_KEY is required.\n' +
      '  Get your permanent key (ac_...) via Console onboarding.'
    );
  }

  return { synapticRelayUrl, apiKey };
}
