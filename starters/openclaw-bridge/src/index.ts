/**
 * index.ts — Multi-Tenant Entry point
 *
 * 1. Load config from .env (parsing multiple AGENT_X_ variables)
 * 2. Start HTTP server providing /:agentId/health and /:agentId/manifest
 * 3. Perform the onboarding check-in to SynapticRelay for EACH configured agent
 */

import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server';
import { checkIn } from './check-in';

export interface AgentConfig {
  id: string;
  token: string;
}

// ─── Global Config ────────────────────────────────────────────────

const SYNAPTICRELAY_URL = (process.env.SYNAPTICRELAY_URL || '').replace(/\/+$/, '');
const PORT = parseInt(process.env.PORT || '8787', 10);
const PUBLIC_HOST = process.env.PUBLIC_HOST || '';
const OPENCLAW_TARGET_URL = (process.env.OPENCLAW_TARGET_URL || '').replace(/\/+$/, '');

// ─── Parsing Agents ───────────────────────────────────────────────

function parseAgents(): AgentConfig[] {
  const agents: AgentConfig[] = [];
  
  // Look for any AGENT_X_ID environment variables and match them with TOKENS
  const envKeys = Object.keys(process.env);
  const idKeys = envKeys.filter(k => k.match(/^AGENT_\d+_ID$/));

  for (const idKey of idKeys) {
    const prefixMatch = idKey.match(/^(AGENT_\d+)_ID$/);
    if (!prefixMatch) continue;

    const prefix = prefixMatch[1];
    const id = process.env[`${prefix}_ID`];
    const token = process.env[`${prefix}_TOKEN`];

    if (id && token) {
      agents.push({ id, token });
    } else {
      console.warn(`⚠️  Incomplete config for ${prefix}. Both ID and TOKEN are required.`);
    }
  }

  return agents;
}

// ─── Validation ───────────────────────────────────────────────────

function validateConfig(agents: AgentConfig[]): void {
  const missing: string[] = [];
  if (!SYNAPTICRELAY_URL) missing.push('SYNAPTICRELAY_URL');
  if (!OPENCLAW_TARGET_URL) missing.push('OPENCLAW_TARGET_URL');
  
  if (missing.length > 0) {
    console.error('❌ Missing required global environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\nCopy .env.example → .env and fill in the values.');
    process.exit(1);
  }

  if (agents.length === 0) {
    console.error('❌ No agents configured! Please provide at least AGENT_1_ID and AGENT_1_TOKEN.');
    process.exit(1);
  }
}

// ─── Resolve public endpoint URL ──────────────────────────────────

async function resolveEndpointUrl(): Promise<string> {
  if (PUBLIC_HOST) {
    return `http://${PUBLIC_HOST}:${PORT}`;
  }

  // Try to auto-detect public IP via a free service
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(5000),
    });
    const { ip } = await res.json() as { ip: string };
    console.log(`🌐 Auto-detected public IP: ${ip}`);
    return `http://${ip}:${PORT}`;
  } catch {
    console.warn('⚠️  Could not auto-detect public IP. Falling back to localhost.');
    console.warn('   Set PUBLIC_HOST in .env if running behind NAT/firewall.');
    return `http://localhost:${PORT}`;
  }
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   SynapticRelay · Multi-Tenant Bridge v2.0   ║');
  console.log('╚══════════════════════════════════════════════╝');

  const agents = parseAgents();
  validateConfig(agents);

  console.log(`\n📋 Found ${agents.length} configured agents:`);
  agents.forEach(a => console.log(`   - ${a.id}`));

  const app = createServer(agents, OPENCLAW_TARGET_URL);

  // Step 1: Start HTTP server FIRST (SynapticRelay will call us immediately after check-in)
  await new Promise<void>((resolve) => {
    app.listen(PORT, () => {
      console.log(`\n🔌 Bridge HTTP multiplexer listening on port ${PORT}`);
      console.log(`   GET  http://localhost:${PORT}/:agentId/health`);
      console.log(`   GET  http://localhost:${PORT}/:agentId/manifest`);
      console.log(`   POST http://localhost:${PORT}/:agentId/invoke`);
      resolve();
    });
  });

  // Step 2: Resolve public global URL
  const baseEndpointUrl = await resolveEndpointUrl();

  // Step 3: Check in with SynapticRelay for EACH agent
  console.log(`\n🚀 Starting check-ins for ${agents.length} agents...`);
  
  const checkInPromises = agents.map(async (agent) => {
    // Crucial: The endpointUrl must map dynamically to this specific agent
    const dynamicEndpointUrl = `${baseEndpointUrl}/${agent.id}`;
    
    console.log(`\n[${agent.id}] Checking in with URL: ${dynamicEndpointUrl}`);
    const result = await checkIn(SYNAPTICRELAY_URL, agent.token, dynamicEndpointUrl, agent.id);
    
    if (result.success && result.apiKey) {
      // Sync memory with the auto-upgraded API key
      agent.token = result.apiKey;
    } else if (!result.success) {
      console.error(`[${agent.id}] ⚠️  Check-in failed.`);
    }
  });

  await Promise.all(checkInPromises);
  console.log('\n🏁 All startup routines completed.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
