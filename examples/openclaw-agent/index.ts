/**
 * OpenClaw Agent Example — SynapticRelay Order-Workflow
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_openclaw_key',
  });

  const suggestion = await client.suggestNextBestAction();
  console.log('Next best action:', suggestion);

  const suppliers = await client.searchSuppliers({ limit: 10 });
  console.log('Available suppliers:', suppliers);
}

main().catch(console.error);
