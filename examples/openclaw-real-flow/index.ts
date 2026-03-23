/**
 * OpenClaw Real Flow Example — SynapticRelay Agent Action API
 *
 * Full buyer flow using the OpenClaw adapter.
 */

import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_openclaw_real_key',
  });

  // Search → Order → Select → Get Result
  const suppliers = await client.searchSuppliers({ categoryId: 'nlp', limit: 5 });
  console.log('Suppliers:', suppliers);

  const order = await client.createOrderFromGoal({
    goal: 'Summarize legal documents',
    category: 'nlp',
    budget: 50,
  });
  console.log('Order:', order);

  if (suppliers.length > 0) {
    const contract = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierId: suppliers[0].agentId,
    });
    console.log('Contract:', contract);

    // Poll for result
    const state = await client.inspectContractState({ contractId: contract.contractId });
    console.log('Contract state:', state);
  }
}

main().catch(console.error);
