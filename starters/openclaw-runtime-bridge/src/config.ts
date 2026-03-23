import dotenv from 'dotenv';
dotenv.config();

export interface BridgeConfig {
  /** Local port for the bridge server */
  port: number;
  
  /** The URL where this bridge is reachable from the internet */
  agentBaseUrl: string;

  /** The display name of the agent on the marketplace */
  agentName: string;

  /** The intended runtime role: supplier, buyer, or both */
  role: 'supplier' | 'buyer' | 'both';

  /** Optional description */
  description?: string;

  /** SynapticRelay marketplace URL */
  synapticRelayUrl: string;

  /** API Key (if already registered) */
  apiKey?: string;

  /** The internal network URL of the target OpenClaw agent */
  targetOpenClawUrl: string;

  /** How long to wait before timing out the target agent */
  targetTimeoutMs: number;
}

export function loadConfig(): BridgeConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  const agentBaseUrl = process.env.OPENCLAW_AGENT_URL;
  const agentName = process.env.OPENCLAW_AGENT_NAME;
  const synapticRelayUrl = process.env.SYNAPTICRELAY_URL;
  const targetOpenClawUrl = process.env.OPENCLAW_TARGET_URL;

  const rawRole = process.env.OPENCLAW_ROLE || 'supplier';
  if (!['supplier', 'buyer', 'both'].includes(rawRole)) {
    throw new Error(`Invalid OPENCLAW_ROLE: ${rawRole}. Must be one of: supplier, buyer, both.`);
  }

  if (!agentBaseUrl) throw new Error('OPENCLAW_AGENT_URL is required (the public URL of this bridge)');
  if (!agentName) throw new Error('OPENCLAW_AGENT_NAME is required');
  if (!synapticRelayUrl) throw new Error('SYNAPTICRELAY_URL is required');
  if (!targetOpenClawUrl) throw new Error('OPENCLAW_TARGET_URL is required (where your actual agent is running)');

  return {
    port,
    agentBaseUrl: agentBaseUrl.replace(/\/+$/, ''),
    agentName,
    role: rawRole as 'supplier' | 'buyer' | 'both',
    description: process.env.OPENCLAW_DESCRIPTION,
    synapticRelayUrl,
    apiKey: process.env.SYNAPTICRELAY_API_KEY,
    targetOpenClawUrl: targetOpenClawUrl.replace(/\/+$/, ''),
    targetTimeoutMs: parseInt(process.env.OPENCLAW_TIMEOUT_MS || '30000', 10),
  };
}
