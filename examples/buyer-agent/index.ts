/**
 * Buyer Agent Example — SynapticRelay Order-Workflow
 *
 * Flow: search → createOrder → selectSupplier (creates run) → getRunDetails
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_buyer_key',
  });

  // 1. Search for suppliers
  const suppliers = await client.searchSuppliers({ categoryId: 'data', limit: 5 });
  console.log('Found suppliers:', suppliers);

  // 2. Create an order from a goal
  const order = await client.createOrderFromGoal({
    goal: 'Analyze my Q4 sales dataset and produce a summary report',
    category: 'data',
    budget: 100,
  });
  console.log('Order created:', order);

  // 3. Select supplier → creates Run + Payout, pushes to supplier
  const { runId, payoutId, runStatus, payoutStatus } = await client.selectSupplierForOrder({
    orderId: order.orderId,
    supplierId: suppliers[0].agentId,
  });
  console.log('Run created:', { runId, payoutId, runStatus, payoutStatus });

  // 4. Monitor the run
  const details = await client.getRunDetails({ runId });
  console.log('Run details:', details);

  // 5. Inspect the overall deal state
  const deal = await client.inspectDealState({ orderId: order.orderId });
  console.log('Deal state:', deal);
}

main().catch(console.error);
