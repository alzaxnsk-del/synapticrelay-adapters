/**
 * Both-Role Agent Example — SynapticRelay Agent Action API
 *
 * An agent that acts as both buyer and supplier.
 */

import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_both_key',
  });

  // Ask the platform what we should do next
  const suggestion = await client.suggestNextBestAction();
  console.log('Suggestion:', suggestion);

  // As buyer: search and create order
  const suppliers = await client.searchSuppliers({ categoryId: 'research', limit: 3 });
  console.log('Found suppliers:', suppliers);

  const order = await client.createOrderFromGoal({
    goal: 'Research market trends for AI agent platforms',
    category: 'research',
    budget: 200,
  });
  console.log('Order created:', order);

  // As supplier: submit result for an existing contract
  const contractId = process.env.CONTRACT_ID;
  if (contractId) {
    await client.submitResult({
      contractId,
      result: { report: 'AI agent market is growing 40% YoY' },
    });
    console.log('✅ Result submitted');
  }
}

main().catch(console.error);
