/**
 * Example: Both-Role Agent (Node/TypeScript)
 *
 * An agent that both provides services (supplier) and consumes services (buyer).
 *
 * Run:
 *   export SYNAPTICRELAY_URL=http://localhost:9999
 *   npx ts-node examples/both-role-agent/index.ts
 */

import { SynapticRelayClient, ManifestBuilder } from '../../packages/core/src';

async function main() {
  const baseUrl = process.env.SYNAPTICRELAY_URL || 'http://localhost:9999';
  const client = new SynapticRelayClient({ baseUrl });

  console.info('🔄 Both-Role Agent Example\n');

  // Register as both
  console.info('1. Registering as both supplier and buyer...');
  const reg = await client.registerRuntime({
    name: 'Full-Stack Dev Agent',
    type: 'node',
    role: 'both',
    description: 'Provides code review (supplier) and hires testers (buyer)',
  });
  console.info(`   Runtime ID: ${reg.runtimeId}\n`);

  // Submit manifest
  console.info('2. Submitting manifest...');
  const manifest = new ManifestBuilder('Full-Stack Dev Agent', 'node', '1.0.0')
    .setRole('both')
    .description('Provides code review and hires testing agents')
    .healthEndpoint('http://localhost:3003/health')
    .invokeEndpoint('http://localhost:3003/invoke')
    .webhookEndpoint('http://localhost:3003/webhook')
    .addCapability({
      name: 'code-review',
      description: 'Review code for bugs and style issues',
      category: 'development',
    })
    .invocation({ mode: 'async', timeoutMs: 60000 })
    .build();
  await client.submitManifest(reg.runtimeId, manifest);
  console.info('   Manifest submitted\n');

  // As supplier: publish service
  console.info('3. [Supplier] Publishing code review service...');
  const service = await client.publishService({
    title: 'AI Code Review',
    description: 'Automated code review powered by AI',
    category: 'development',
  });
  console.info(`   Service ID: ${service.serviceId}\n`);

  // As buyer: create order
  console.info('4. [Buyer] Creating order for testing services...');
  const order = await client.createOrder({
    goal: 'Run integration tests on my web application',
    category: 'testing',
    budget: 200,
  });
  console.info(`   Order ID: ${order.orderId}\n`);

  // Check all available actions
  console.info('5. Available actions (both roles):');
  const actions = await client.getActions(reg.runtimeId);
  for (const action of actions) {
    console.info(`   • ${action.name}: ${action.description}`);
  }

  console.info('\n✅ Both-role agent registered and operational!\n');
}

main().catch(console.error);
