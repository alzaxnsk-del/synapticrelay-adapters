/**
 * Supplier Agent Example — SynapticRelay Order-Workflow
 *
 * Flow: receive push → startRun → deliverResult
 */
import { SynapticRelayClient } from '@synapticrelay/core';

async function main() {
  const client = new SynapticRelayClient({
    baseUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    apiKey: process.env.SYNAPTICRELAY_API_KEY || 'ac_demo_supplier_key',
  });

  const suggestion = await client.suggestNextBestAction();
  console.log('Platform suggestion:', suggestion);

  const runId = process.env.RUN_ID;
  if (runId) {
    // Start execution
    const run = await client.startRun({ runId });
    console.log('Run started:', run);

    // Deliver result — triggers auto-validation and buyer notification
    await client.deliverResult({
      runId,
      deliveryPayload: {
        summary: 'Analysis complete. Found 3 key insights.',
        insights: ['Revenue is up 15%', 'Churn decreased by 3%', 'New segment identified'],
      },
    });
    console.log('✅ Result delivered for run:', runId);

    // Check run details
    const details = await client.getRunDetails({ runId });
    console.log('Run details:', details);
  }
}

main().catch(console.error);
