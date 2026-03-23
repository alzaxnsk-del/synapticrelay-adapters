import type { RuntimeType, RuntimeRole, InvocationMode, AuthType } from '@synapticrelay/core';

/**
 * Configuration for the OpenClaw adapter.
 */
export interface OpenClawConfig {
  /** SynapticRelay API base URL */
  synapticRelayUrl: string;

  /** SynapticRelay API key (received after registration) */
  apiKey?: string;

  /** JWT token for owner-level operations */
  jwtToken?: string;

  /** Agent display name on SynapticRelay */
  agentName: string;

  /** Role on the marketplace */
  role: RuntimeRole;

  /** Base URL where this OpenClaw agent is reachable */
  agentBaseUrl: string;

  /** Description of what this agent does */
  description?: string;

  /** OpenClaw agent version */
  version?: string;

  /** Invocation mode (default: sync) */
  invocationMode?: InvocationMode;

  /** Whether to enable the MCP bridge */
  mcpEnabled?: boolean;

  /** MCP server URL if using MCP bridge */
  mcpServerUrl?: string;
}

/**
 * Build config from environment variables.
 *
 * Environment variables:
 * - SYNAPTICRELAY_URL (required)
 * - SYNAPTICRELAY_API_KEY
 * - SYNAPTICRELAY_JWT
 * - OPENCLAW_AGENT_NAME (required)
 * - OPENCLAW_AGENT_URL (required)
 * - OPENCLAW_ROLE (default: supplier)
 * - OPENCLAW_DESCRIPTION
 * - OPENCLAW_VERSION (default: 1.0.0)
 * - OPENCLAW_INVOCATION_MODE (default: sync)
 * - OPENCLAW_MCP_ENABLED (default: false)
 * - OPENCLAW_MCP_SERVER_URL
 */
export function configFromEnv(): OpenClawConfig {
  const synapticRelayUrl = process.env.SYNAPTICRELAY_URL;
  const agentName = process.env.OPENCLAW_AGENT_NAME;
  const agentBaseUrl = process.env.OPENCLAW_AGENT_URL;

  if (!synapticRelayUrl) {
    throw new Error(
      'Missing config: SYNAPTICRELAY_URL is required.\n' +
      '  - For local mock: set to http://localhost:9999\n' +
      '  - For real integration: set to https://api.synapticrelay.io (or your instance)'
    );
  }
  if (!agentName) {
    throw new Error('Missing config: OPENCLAW_AGENT_NAME is required. Example: "My Agent"');
  }
  if (!agentBaseUrl) {
    throw new Error('Missing config: OPENCLAW_AGENT_URL is required. Example: "http://localhost:3000"');
  }

  const role = (process.env.OPENCLAW_ROLE || 'supplier') as RuntimeRole;
  if (!['supplier', 'buyer', 'both'].includes(role)) {
    throw new Error(`Invalid OPENCLAW_ROLE: ${role}. Must be supplier, buyer, or both.`);
  }

  return {
    synapticRelayUrl,
    apiKey: process.env.SYNAPTICRELAY_API_KEY,
    jwtToken: process.env.SYNAPTICRELAY_JWT,
    agentName,
    agentBaseUrl: agentBaseUrl.replace(/\/+$/, ''),
    role,
    description: process.env.OPENCLAW_DESCRIPTION,
    version: process.env.OPENCLAW_VERSION || '1.0.0',
    invocationMode: (process.env.OPENCLAW_INVOCATION_MODE || 'sync') as InvocationMode,
    mcpEnabled: process.env.OPENCLAW_MCP_ENABLED === 'true',
    mcpServerUrl: process.env.OPENCLAW_MCP_SERVER_URL,
  };
}
