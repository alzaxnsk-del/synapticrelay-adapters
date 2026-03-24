/**
 * OpenClaw Real Flow — Full Order Workflow
 *
 * Buyer: createOrder → findSuppliers → selectSupplier
 * Supplier: getSupplierRuns → startRun → deliverResult
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_openclaw_real_key',
  });

  // Buyer side
  const order = await client.createOrderFromGoal({ goal: 'Summarize legal documents', category: 'nlp', budget: 50 });
  console.log('Order:', order);

  const candidates = await client.findSuppliersForOrder({ orderId: order.orderId });
  console.log('Candidates:', candidates);

  if (candidates.length > 0) {
    const { runId, payoutId } = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierAgentId: candidates[0].agentId,
    });
    console.log('Run+Payout created:', { runId, payoutId });

    // Supplier side (same agent in this example)
    const run = await client.startRun({ runId });
    console.log('Run started:', run);

    await client.deliverResult({ runId, deliveryPayload: { summary: 'Legal summary complete.' } });
    console.log('✅ Result delivered');

    const deal = await client.inspectDealState({ contractId: runId });
    console.log('Deal state:', deal);
  }
}

main().catch(console.error);
