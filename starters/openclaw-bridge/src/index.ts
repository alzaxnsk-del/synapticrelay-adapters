/**
 * index.ts — Entry point
 *
 * 1. Load config from .env
 * 2. Start HTTP server (so /health and /manifest are available)
 * 3. Perform the onboarding check-in to SynapticRelay
 */

import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server';
import { checkIn } from './check-in';

// ─── Config ───────────────────────────────────────────────────────

const SYNAPTICRELAY_URL = (process.env.SYNAPTICRELAY_URL || '').replace(/\/+$/, '');
const CONNECT_TOKEN = process.env.SYNAPTICRELAY_CONNECT_TOKEN || '';
const AGENT_ID = process.env.OPENCLAW_AGENT_ID || 'my-agent';
const PORT = parseInt(process.env.PORT || '8787', 10);
const PUBLIC_HOST = process.env.PUBLIC_HOST || '';

// ─── Validation ───────────────────────────────────────────────────

function validateConfig(): void {
  const missing: string[] = [];
  if (!SYNAPTICRELAY_URL) missing.push('SYNAPTICRELAY_URL');
  if (!CONNECT_TOKEN) missing.push('SYNAPTICRELAY_CONNECT_TOKEN');
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\nCopy .env.example → .env and fill in the values.');
    process.exit(1);
  }
  if (!CONNECT_TOKEN.startsWith('oc_tmp_')) {
    console.warn('⚠️  SYNAPTICRELAY_CONNECT_TOKEN does not start with "oc_tmp_".');
    console.warn('   Make sure you pasted the correct temporary token from the dashboard.');
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
  console.log('║   SynapticRelay · OpenClaw Bridge  v1.0.0   ║');
  console.log('╚══════════════════════════════════════════════╝');

  validateConfig();

  const app = createServer(AGENT_ID);

  // Step 1: Start HTTP server FIRST (SynapticRelay will call us immediately after check-in)
  await new Promise<void>((resolve) => {
    app.listen(PORT, () => {
      console.log(`\n🔌 Bridge HTTP server listening on port ${PORT}`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/manifest`);
      console.log(`   POST http://localhost:${PORT}/invoke`);
      resolve();
    });
  });

  // Step 2: Resolve public URL
  const endpointUrl = await resolveEndpointUrl();

  // Step 3: Check in with SynapticRelay
  const result = await checkIn(SYNAPTICRELAY_URL, CONNECT_TOKEN, endpointUrl);

  if (!result.success) {
    console.error('\n⚠️  Check-in failed, but the bridge server is still running.');
    console.error('   Fix the issue above and restart the bridge.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
