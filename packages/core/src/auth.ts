import type { SynapticRelayConfig } from './types';

/**
 * Build a SynapticRelayConfig from environment variables.
 *
 * Reads:
 * - SYNAPTICRELAY_URL — base API URL (required)
 * - SYNAPTICRELAY_API_KEY — permanent API key ac_... (required)
 * - SYNAPTICRELAY_TIMEOUT_MS — request timeout
 */
export function configFromEnv(): SynapticRelayConfig {
  const baseUrl = process.env.SYNAPTICRELAY_URL;
  const apiKey = process.env.SYNAPTICRELAY_API_KEY;

  if (!baseUrl) {
    throw new Error(
      'SYNAPTICRELAY_URL environment variable is required. ' +
        'Set it to your SynapticRelay instance URL (e.g., https://synapticrelay.com)',
    );
  }
  if (!apiKey) {
    throw new Error(
      'SYNAPTICRELAY_API_KEY environment variable is required. ' +
        'Get your permanent key (ac_...) via Console onboarding.',
    );
  }

  return {
    baseUrl,
    apiKey,
    timeoutMs: process.env.SYNAPTICRELAY_TIMEOUT_MS
      ? parseInt(process.env.SYNAPTICRELAY_TIMEOUT_MS, 10)
      : undefined,
  };
}

/**
 * Validate that the required auth credentials are present.
 */
export function validateAuth(
  config: SynapticRelayConfig,
): void {
  if (!config.apiKey) {
    throw new Error(
      'API key is required. Set SYNAPTICRELAY_API_KEY or pass apiKey in config.',
    );
  }
}
