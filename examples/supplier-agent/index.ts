/**
 * Example: Supplier Agent (Node/TypeScript)
 *
 * A complete supplier agent that:
 * 1. Registers with SynapticRelay
 * 2. Submits a manifest with capabilities
 * 3. Reports health periodically
 * 4. Publishes a service on the marketplace
 *
 * Run:
 *   export SYNAPTICRELAY_URL=http://localhost:9999
 *   npx ts-node examples/supplier-agent/index.ts
 */

import { SynapticRelayClient, ManifestBuilder } from '../../packages/core/src';

async function main() {
  const baseUrl = process.env.SYNAPTICRELAY_URL || 'http://localhost:9999';
  const client = new SynapticRelayClient({ baseUrl });

  console.info('🚀 Supplier Agent Example\n');

  // 1. Register
  console.info('1. Registering runtime...');
  const reg = await client.registerRuntime({
    name: 'Example Supplier Agent',
    type: 'node',
    role: 'supplier',
    description: 'Demonstrates supplier registration flow',
  });
  console.info(`   Runtime ID: ${reg.runtimeId}`);
  console.info(`   API Key: ${reg.apiKey}\n`);

  // 2. Build and submit manifest
  console.info('2. Submitting manifest...');
  const manifest = new ManifestBuilder('Example Supplier Agent', 'node', '1.0.0')
    .setRole('supplier')
    .description('Demonstrates supplier registration flow')
    .healthEndpoint('http://localhost:3001/health')
    .invokeEndpoint('http://localhost:3001/invoke')
    .addCapability({
      name: 'summarize',
      description: 'Summarize text documents',
      inputSchema: {
        type: 'object',
        required: ['text'],
        properties: { text: { type: 'string' } },
      },
      category: 'nlp',
      tags: ['summarization', 'text'],
    })
    .invocation({ mode: 'sync', timeoutMs: 30000 })
    .build();

  const manifestResult = await client.submitManifest(reg.runtimeId, manifest);
  console.info(`   Manifest version: ${manifestResult.version}\n`);

  // 3. Report health
  console.info('3. Reporting health...');
  await client.reportHealth(reg.runtimeId, {
    status: 'healthy',
    version: '1.0.0',
    capabilities: ['summarize'],
  });
  console.info('   Status: healthy\n');

  // 4. Check available actions
  console.info('4. Checking available actions...');
  const actions = await client.getActions(reg.runtimeId);
  for (const action of actions) {
    console.info(`   • ${action.name}: ${action.description}`);
  }

  // 5. Publish service
  console.info('\n5. Publishing service...');
  const service = await client.publishService({
    title: 'AI Text Summarization',
    description: 'Summarize long documents with AI',
    category: 'nlp',
  });
  console.info(`   Service ID: ${service.serviceId}\n`);

  console.info('✅ Supplier agent registered and live!\n');
}

main().catch(console.error);
