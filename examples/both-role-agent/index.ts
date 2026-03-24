/**
 * Both-Role Agent Example
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_both_key',
  });

  // As buyer: search and create order
  const order = await client.createOrderFromGoal({ goal: 'Research AI agent trends', category: 'research' });
  console.log('Order:', order);

  const candidates = await client.findSuppliersForOrder({ orderId: order.orderId });
  console.log('Candidates:', candidates);

  // As supplier: poll for runs and deliver
  const supplierAgentId = process.env.SUPPLIER_AGENT_ID || 'agent_my_supplier';
  const runs = await client.getSupplierRuns({ supplierAgentId, status: 'queued' });
  for (const run of runs) {
    await client.startRun({ runId: run.runId });
    await client.deliverResult({ runId: run.runId, deliveryPayload: { report: 'AI agents growing 40% YoY' } });
    console.log(`✅ Delivered run ${run.runId}`);
  }
}

main().catch(console.error);
