/**
 * OpenClaw Real SynapticRelay Integration
 *
 * This example connects to a REAL SynapticRelay instance (not the mock server).
 * It proves the adapter works end-to-end against the live integration surface.
 *
 * Prerequisites:
 *   export SYNAPTICRELAY_URL=https://synapticrelay.com   (or your instance)
 *   # Optionally: export SYNAPTICRELAY_JWT=your_jwt_token
 *
 * Run:
 *   npx ts-node examples/openclaw-real-flow/index.ts
 *
 * What it does:
 *   1. Registers a runtime → gets real runtimeId + apiKey
 *   2. Submits a manifest → accepted by server
 *   3. Reports health → server acknowledges
 *   4. Queries actions → role-aware list returned
 *   5. Queries trust → trust state returned
 *   6. Cleans up → deletes the test runtime
 */

import { SynapticRelayClient, ManifestBuilder } from '../../packages/core/src';

async function main() {
  const baseUrl = process.env.SYNAPTICRELAY_URL;

  if (!baseUrl) {
    console.error('❌ SYNAPTICRELAY_URL is not set.');
    console.error('');
    console.error('This example connects to a REAL SynapticRelay instance.');
    console.error('Set it to your SynapticRelay URL:');
    console.error('');
    console.error('  export SYNAPTICRELAY_URL=https://synapticrelay.com');
    console.error('');
    console.error('For local mock testing, use examples/openclaw-agent/ instead.');
    process.exit(1);
  }

  console.info('');
  console.info('🔗 OpenClaw Real SynapticRelay Integration');
  console.info('');
  console.info(`   Target: ${baseUrl}`);
  console.info('');

  const client = new SynapticRelayClient({
    baseUrl,
    jwtToken: process.env.SYNAPTICRELAY_JWT,
  });

  let runtimeId: string | undefined;

  try {
    // ─── Step 1: Register ────────────────────────────────────────
    console.info('1. Registering runtime...');

    const reg = await client.registerRuntime({
      name: 'OpenClaw Integration Test',
      type: 'openclaw',
      role: 'supplier',
      description: 'Adapter integration verification — safe to delete',
    });

    runtimeId = reg.runtimeId;
    console.info(`   ✅ Runtime ID: ${reg.runtimeId}`);
    console.info(`   🔑 API Key: ${reg.apiKey.substring(0, 12)}...`);
    console.info('');

    // ─── Step 2: Submit manifest ─────────────────────────────────
    console.info('2. Submitting manifest...');

    const manifest = new ManifestBuilder('OpenClaw Integration Test', 'openclaw', '1.0.0')
      .setRole('supplier')
      .description('Adapter integration verification agent')
      .healthEndpoint(`${baseUrl}/health`)
      .invokeEndpoint(`${baseUrl}/invoke`)
      .addCapability({
        name: 'echo',
        description: 'Echo input back (integration test capability)',
        inputSchema: {
          type: 'object',
          properties: { message: { type: 'string' } },
        },
      })
      .invocation({ mode: 'sync', timeoutMs: 10000 })
      .build();

    const manifestResult = await client.submitManifest(reg.runtimeId, manifest);
    console.info(`   ✅ Manifest accepted (version: ${manifestResult.version})`);
    console.info('');

    // ─── Step 3: Health report ───────────────────────────────────
    console.info('3. Reporting health...');

    await client.reportHealth(reg.runtimeId, {
      status: 'healthy',
      version: '1.0.0',
      capabilities: ['echo'],
    });
    console.info('   ✅ Health reported: healthy');
    console.info('');

    // ─── Step 4: Query actions ───────────────────────────────────
    console.info('4. Checking available actions...');

    const actions = await client.getActions(reg.runtimeId);
    console.info(`   ✅ ${actions.length} action(s) available for supplier role`);
    for (const action of actions.slice(0, 5)) {
      console.info(`      • ${action.name}: ${action.description}`);
    }
    console.info('');

    // ─── Step 5: Query trust ─────────────────────────────────────
    console.info('5. Checking trust state...');

    const trust = await client.getTrust(reg.runtimeId);
    console.info(`   ✅ Trust state retrieved`);
    console.info(`      Verified: ${trust.verified}`);
    console.info(`      Reputation: ${trust.reputationScore}`);
    console.info('');

    // ─── Done ────────────────────────────────────────────────────
    console.info('🎉 Real integration verified!');
    console.info('');
    console.info('   All 5 steps completed against a live SynapticRelay instance.');
    console.info('   This proves the adapter spec and client are compatible');
    console.info('   with the real integration surface.');
    console.info('');

  } catch (error) {
    const e = error as Error;
    console.error(`❌ ${e.message}`);

    if (e.message.includes('Network') || e.message.includes('fetch')) {
      console.error('   Check that SYNAPTICRELAY_URL is correct and the server is running.');
    } else if (e.message.includes('401') || e.message.includes('Authentication')) {
      console.error('   Check SYNAPTICRELAY_JWT or SYNAPTICRELAY_API_KEY.');
    }

    console.error('');
    process.exit(1);
  } finally {
    // ─── Cleanup ─────────────────────────────────────────────────
    if (runtimeId) {
      try {
        console.info('🧹 Cleaning up test runtime...');
        await client.deleteRuntime(runtimeId);
        console.info('   ✅ Test runtime deleted');
      } catch {
        console.info('   ⚠️  Could not delete test runtime (may need manual cleanup)');
      }
      console.info('');
    }
  }
}

main();
