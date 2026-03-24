/**
 * Supplier Agent Example — Polling Model
 *
 * Supplier polls for queued runs, starts them, and delivers results.
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_supplier_key',
  });

  const supplierAgentId = process.env.SUPPLIER_AGENT_ID || 'agent_my_supplier';

  // 1. Poll for queued runs
  const queuedRuns = await client.getSupplierRuns({ supplierAgentId, status: 'queued' });
  console.log(`Found ${queuedRuns.length} queued runs`);

  for (const run of queuedRuns) {
    // 2. Start execution
    const started = await client.startRun({ runId: run.runId });
    console.log(`Started run ${started.runId}, status: ${started.status}`);

    // 3. Deliver result
    await client.deliverResult({
      runId: run.runId,
      deliveryPayload: {
        summary: 'Analysis complete. Found 3 key insights.',
        insights: ['Revenue up 15%', 'Churn down 3%', 'New segment found'],
      },
    });
    console.log(`✅ Delivered result for run ${run.runId}`);

    // 4. Check deal state
    const deal = await client.inspectDealState({ contractId: run.runId });
    console.log('Deal state:', deal);
  }
}

main().catch(console.error);
