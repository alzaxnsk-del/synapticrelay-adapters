import dotenv from 'dotenv';
dotenv.config();

export interface BridgeConfig {
  /** Local port for the bridge server */
  port: number;
  
  /** The URL where this bridge is reachable from the internet */
  agentBaseUrl: string;

  /** The ID of the agent provided by SynapticRelay UI */
  agentId: string;

  /** The intended runtime role: supplier, buyer, or both */
  role: 'supplier' | 'buyer' | 'both';

  /** Optional description */
  description?: string;

  /** SynapticRelay marketplace URL */
  synapticRelayUrl: string;

  /** Temporary Connection Token */
  connectToken: string;

  /** The internal network URL of the target OpenClaw agent */
  targetOpenClawUrl: string;

  /** How long to wait before timing out the target agent */
  targetTimeoutMs: number;
}

export function loadConfig(): BridgeConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  const agentBaseUrl = process.env.OPENCLAW_AGENT_URL;
  const agentId = process.env.OPENCLAW_AGENT_ID;
  const synapticRelayUrl = process.env.SYNAPTICRELAY_URL;
  const connectToken = process.env.SYNAPTICRELAY_CONNECT_TOKEN;
  const targetOpenClawUrl = process.env.OPENCLAW_TARGET_URL;

  const rawRole = process.env.OPENCLAW_ROLE || 'supplier';
  if (!['supplier', 'buyer', 'both'].includes(rawRole)) {
    throw new Error(`Invalid OPENCLAW_ROLE: ${rawRole}. Must be one of: supplier, buyer, both.`);
  }

  if (!agentBaseUrl) throw new Error('OPENCLAW_AGENT_URL is required (the public URL of this bridge)');
  if (!agentId) throw new Error('OPENCLAW_AGENT_ID is required (obtained from SynapticRelay UI)');
  if (!synapticRelayUrl) throw new Error('SYNAPTICRELAY_URL is required');
  if (!connectToken) throw new Error('SYNAPTICRELAY_CONNECT_TOKEN is required (obtained from SynapticRelay UI)');
  if (!targetOpenClawUrl) throw new Error('OPENCLAW_TARGET_URL is required (where your actual agent is running)');

  return {
    port,
    agentBaseUrl: agentBaseUrl.replace(/\/+$/, ''),
    agentId,
    role: rawRole as 'supplier' | 'buyer' | 'both',
    description: process.env.OPENCLAW_DESCRIPTION,
    synapticRelayUrl,
    connectToken,
    targetOpenClawUrl: targetOpenClawUrl.replace(/\/+$/, ''),
    targetTimeoutMs: parseInt(process.env.OPENCLAW_TIMEOUT_MS || '30000', 10),
  };
}
