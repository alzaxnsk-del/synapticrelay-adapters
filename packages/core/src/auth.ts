import type { SynapticRelayConfig } from './types';

/**
 * Build a SynapticRelayConfig from environment variables.
 *
 * Reads:
 * - SYNAPTICRELAY_URL — base API URL (required)
 * - SYNAPTICRELAY_API_KEY — API key for runtime auth
 * - SYNAPTICRELAY_JWT — JWT for owner-level operations
 * - SYNAPTICRELAY_TIMEOUT_MS — request timeout
 */
export function configFromEnv(): SynapticRelayConfig {
  const baseUrl = process.env.SYNAPTICRELAY_URL;
  if (!baseUrl) {
    throw new Error(
      'SYNAPTICRELAY_URL environment variable is required. ' +
        'Set it to your SynapticRelay instance URL (e.g., https://api.synapticrelay.io)',
    );
  }

  return {
    baseUrl,
    apiKey: process.env.SYNAPTICRELAY_API_KEY,
    jwtToken: process.env.SYNAPTICRELAY_JWT,
    timeoutMs: process.env.SYNAPTICRELAY_TIMEOUT_MS
      ? parseInt(process.env.SYNAPTICRELAY_TIMEOUT_MS, 10)
      : undefined,
  };
}

/**
 * Validate that the required auth credentials are present.
 *
 * @param config — SynapticRelay config to check
 * @param requireApiKey — whether an API key is required
 * @param requireJwt — whether a JWT is required
 */
export function validateAuth(
  config: SynapticRelayConfig,
  options: { requireApiKey?: boolean; requireJwt?: boolean } = {},
): void {
  if (options.requireApiKey && !config.apiKey) {
    throw new Error(
      'API key is required. Set SYNAPTICRELAY_API_KEY or pass apiKey in config.',
    );
  }
  if (options.requireJwt && !config.jwtToken) {
    throw new Error(
      'JWT token is required for this operation. Set SYNAPTICRELAY_JWT or pass jwtToken in config.',
    );
  }
}
