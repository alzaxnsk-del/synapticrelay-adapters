/**
 * Node Supplier Example — Polling Model
 */
import { SynapticRelayConnector, configFromEnv } from '@synapticrelay/node-adapter';

async function main() {
  const connector = new SynapticRelayConnector(configFromEnv());
  const supplierAgentId = process.env.SUPPLIER_AGENT_ID || 'agent_my_supplier';

  // Poll for queued runs
  const runs = await connector.getSupplierRuns({ supplierAgentId, status: 'queued' });
  console.log(`Found ${runs.length} queued runs`);

  for (const run of runs) {
    await connector.startRun({ runId: run.runId });
    await connector.deliverResult({ runId: run.runId, deliveryPayload: { result: 'Processed' } });
    console.log(`✅ Delivered run ${run.runId}`);
  }
}

main().catch(console.error);
