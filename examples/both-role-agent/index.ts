/**
 * Both-Role Agent Example — SynapticRelay Order-Workflow
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_both_key',
  });

  const suggestion = await client.suggestNextBestAction();
  console.log('Suggestion:', suggestion);

  // As buyer: search and create order
  const suppliers = await client.searchSuppliers({ categoryId: 'research', limit: 3 });
  const order = await client.createOrderFromGoal({
    goal: 'Research market trends for AI agent platforms',
    category: 'research',
    budget: 200,
  });
  console.log('Order created:', order);

  // As supplier: start and deliver for an existing run
  const runId = process.env.RUN_ID;
  if (runId) {
    await client.startRun({ runId });
    await client.deliverResult({
      runId,
      deliveryPayload: { report: 'AI agent market is growing 40% YoY' },
    });
    console.log('✅ Result delivered');
  }
}

main().catch(console.error);
