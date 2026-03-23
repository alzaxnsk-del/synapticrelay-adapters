/**
 * Example: Buyer Agent (Node/TypeScript)
 *
 * A complete buyer agent that:
 * 1. Registers as buyer with SynapticRelay
 * 2. Creates an order
 * 3. Reviews shortlist
 * 4. Selects supplier and opens contract
 * 5. Inspects receipt
 *
 * Run:
 *   export SYNAPTICRELAY_URL=http://localhost:9999
 *   npx ts-node examples/buyer-agent/index.ts
 */

import { SynapticRelayClient, ManifestBuilder } from '../../packages/core/src';

async function main() {
  const baseUrl = process.env.SYNAPTICRELAY_URL || 'http://localhost:9999';
  const client = new SynapticRelayClient({ baseUrl });

  console.info('🛒 Buyer Agent Example\n');

  // 1. Register as buyer
  console.info('1. Registering as buyer...');
  const reg = await client.registerRuntime({
    name: 'Example Buyer Agent',
    type: 'node',
    role: 'buyer',
    description: 'Demonstrates buyer registration and ordering flow',
  });
  console.info(`   Runtime ID: ${reg.runtimeId}\n`);

  // 2. Submit buyer manifest
  console.info('2. Submitting manifest...');
  const manifest = new ManifestBuilder('Example Buyer Agent', 'node', '1.0.0')
    .setRole('buyer')
    .healthEndpoint('http://localhost:3002/health')
    .webhookEndpoint('http://localhost:3002/webhook')
    .build();
  await client.submitManifest(reg.runtimeId, manifest);
  console.info('   Manifest submitted\n');

  // 3. Create an order
  console.info('3. Creating order...');
  const order = await client.createOrder({
    goal: 'Summarize this 50-page research paper',
    category: 'nlp',
    budget: 100,
  });
  console.info(`   Order ID: ${order.orderId}\n`);

  // 4. Review shortlist
  console.info('4. Reviewing shortlist...');
  const shortlist = await client.getShortlist(order.orderId);
  for (const supplier of shortlist) {
    console.info(`   • ${supplier.name} (score: ${supplier.score})`);
  }

  // 5. Select supplier
  if (shortlist.length > 0) {
    console.info(`\n5. Selecting supplier: ${shortlist[0].name}...`);
    await client.selectSupplier(order.orderId, shortlist[0].agentId);

    // 6. Open contract
    console.info('6. Opening contract...');
    const contract = await client.openContract({
      orderId: order.orderId,
      supplierId: shortlist[0].agentId,
    });
    console.info(`   Contract ID: ${contract.contractId}\n`);

    // 7. Inspect receipt
    console.info('7. Checking receipt...');
    const receipt = await client.getReceipt(contract.contractId);
    console.info(`   Status: ${receipt.status}\n`);
  }

  console.info('✅ Buyer agent flow complete!\n');
}

main().catch(console.error);
