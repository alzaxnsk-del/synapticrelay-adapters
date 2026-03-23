/**
 * Node Supplier Example — SynapticRelay Order-Workflow
 */
import { SynapticRelayConnector, configFromEnv } from '@synapticrelay/node-adapter';

async function main() {
  const connector = new SynapticRelayConnector(configFromEnv());

  const suggestion = await connector.suggestNextBestAction();
  console.log('Next best action:', suggestion);

  const runId = process.env.RUN_ID;
  if (runId) {
    const run = await connector.startRun({ runId });
    console.log('Run started:', run);

    await connector.deliverResult({
      runId,
      deliveryPayload: { analysis: 'Data processed successfully' },
    });
    console.log('✅ Result delivered');

    const details = await connector.getRunDetails({ runId });
    console.log('Run details:', details);
  }
}

main().catch(console.error);
