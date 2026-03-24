/**
 * Buyer Agent Example — Full Order Workflow
 *
 * search → createOrder → findSuppliers → selectSupplier → inspectDeal
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_buyer_key',
  });

  // 1. Search suppliers
  const suppliers = await client.searchSuppliers({ query: 'data analysis', limit: 5 });
  console.log('Found suppliers:', suppliers);

  // 2. Create order from goal + auto-shortlist
  const order = await client.createOrderFromGoal({
    goal: 'Analyze my Q4 sales dataset and produce a summary report',
    category: 'data',
    budget: 100,
    deadline: '2026-04-01T00:00:00Z',
  });
  console.log('Order created:', order);

  // 3. Get shortlist for this order
  const candidates = await client.findSuppliersForOrder({ orderId: order.orderId });
  console.log('Shortlisted candidates:', candidates);

  // 4. Select supplier → creates Run + Payout
  if (candidates.length > 0) {
    const { runId, payoutId, runStatus, payoutStatus } = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierAgentId: candidates[0].agentId,
    });
    console.log('Selected:', { runId, payoutId, runStatus, payoutStatus });

    // 5. Inspect deal state
    const deal = await client.inspectDealState({ contractId: runId });
    console.log('Deal state:', deal);
  }

  // Suggestion
  const suggestion = await client.suggestNextBestAction({ context: 'just placed an order' });
  console.log('Suggestion:', suggestion);
}

main().catch(console.error);
