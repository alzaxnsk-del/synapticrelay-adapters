/**
 * OpenClaw Real Flow Example — Full Order-Workflow
 *
 * createOrder → selectSupplier → startRun → deliverResult
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_openclaw_real_key',
  });

  // Buyer: search → order → select
  const suppliers = await client.searchSuppliers({ categoryId: 'nlp', limit: 5 });
  console.log('Suppliers:', suppliers);

  const order = await client.createOrderFromGoal({
    goal: 'Summarize legal documents',
    category: 'nlp',
    budget: 50,
  });
  console.log('Order:', order);

  if (suppliers.length > 0) {
    const { runId, payoutId } = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierId: suppliers[0].agentId,
    });
    console.log('Run created:', { runId, payoutId });

    // Supplier side: start and deliver
    const run = await client.startRun({ runId });
    console.log('Run started:', run);

    await client.deliverResult({
      runId,
      deliveryPayload: { summary: 'Legal summary completed.' },
    });
    console.log('✅ Result delivered');

    // Check final state
    const details = await client.getRunDetails({ runId });
    console.log('Run details:', details);
  }
}

main().catch(console.error);
