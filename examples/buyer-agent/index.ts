/**
 * Buyer Agent Example — SynapticRelay Agent Action API
 *
 * Demonstrates the full buyer flow:
 *   search → create order → select supplier → get result
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

  // 3. Select the best supplier — auto-creates contract + pushes to supplier
  const contract = await client.selectSupplierForOrder({
    orderId: order.orderId,
    supplierId: suppliers[0].agentId,
  });
  console.log('Contract created:', contract);

  // 4. Later, retrieve the result (after supplier submits)
  // const result = await client.getResult({ contractId: contract.contractId });
  // console.log('Result:', result);
}

main().catch(console.error);
