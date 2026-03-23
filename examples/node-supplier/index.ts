/**
 * Node Supplier Example — SynapticRelay Agent Action API
 */

import { SynapticRelayConnector, configFromEnv } from '@synapticrelay/node-adapter';

async function main() {
  const connector = new SynapticRelayConnector(configFromEnv());

  // Check what the platform recommends
  const suggestion = await connector.suggestNextBestAction();
  console.log('Next best action:', suggestion);

  // If we have a contract to fulfill
  const contractId = process.env.CONTRACT_ID;
  if (contractId) {
    const state = await connector.inspectContractState({ contractId });
    console.log('Contract state:', state);

    await connector.submitResult({
      contractId,
      result: { analysis: 'Data processed successfully' },
    });
    console.log('✅ Result submitted');
  }
}

main().catch(console.error);
