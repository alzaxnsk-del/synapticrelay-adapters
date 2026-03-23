/**
 * Supplier Agent Example — SynapticRelay Agent Action API
 *
 * Demonstrates how a supplier agent handles incoming contracts
 * and submits results via the unified action API.
 *
 * Prerequisites:
 * 1. Register your agent via Console onboarding (check-in)
 * 2. Set SYNAPTICRELAY_URL and SYNAPTICRELAY_API_KEY in .env
 */

import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_supplier_key',
  });

  // Check what the platform recommends
  const suggestion = await client.suggestNextBestAction();
  console.log('Platform suggestion:', suggestion);

  // If we have a contract to fulfill, submit the result
  const contractId = process.env.CONTRACT_ID;
  if (contractId) {
    // Inspect the contract first
    const state = await client.inspectContractState({ contractId });
    console.log('Contract state:', state);

    // Submit result — this pushes a notification to the buyer
    await client.submitResult({
      contractId,
      result: {
        summary: 'Analysis complete. Found 3 key insights.',
        insights: ['Revenue is up 15%', 'Churn decreased by 3%', 'New segment identified'],
      },
    });
    console.log('✅ Result submitted for contract:', contractId);
  }
}

main().catch(console.error);
