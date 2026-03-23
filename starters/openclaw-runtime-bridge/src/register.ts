import { SynapticRelayClient, validateManifest, type RuntimeManifest } from '@synapticrelay/core';
import { loadConfig } from './config';
import fs from 'fs';
import path from 'path';

/**
 * Script to automatically register the current bridge target into SynapticRelay.
 */
async function registerBridge() {
  console.log('🔄 Loading configuration...');
  const config = loadConfig();

  // 1. Read the manifest
  const manifestPath = path.resolve(__dirname, '../manifest-starter.json');
  console.log(`📄 Reading manifest from: ${manifestPath}`);
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifest file not found. Have you created manifest-starter.json?');
    process.exit(1);
  }

  const rawManifest = fs.readFileSync(manifestPath, 'utf8');
  let manifest: RuntimeManifest;

  try {
    manifest = JSON.parse(rawManifest);
  } catch (err: any) {
    console.error(`❌ Manifest contains invalid JSON: ${err.message}`);
    process.exit(1);
  }

  // Update manifest endpoints dynamically so they match the live config
  manifest.endpoints = {
    health: `${config.agentBaseUrl}/health`,
    invoke: `${config.agentBaseUrl}/invoke`,
  };

  // 2. Validate manifest shape
  console.log('🔍 Validating manifest against Schema 1.0...');
  const validation = validateManifest(manifest);
  if (!validation.valid) {
    console.error('❌ Manifest validation failed:');
    validation.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  // 3. Connect to SynapticRelay
  console.log(`🔌 Connecting to SynapticRelay at: ${config.synapticRelayUrl}`);
  const client = new SynapticRelayClient({
    baseUrl: config.synapticRelayUrl,
    apiKey: config.apiKey, // Uses existing key if present
  });

  try {
    // 4. Register identity
    console.log(`👤 Registering runtime: ${config.agentName} (Role: Supplier)`);
    const regResult = await client.registerRuntime({
      name: config.agentName,
      type: 'openclaw',
      role: 'supplier',
      description: config.description,
    });

    console.log(`✅ Registration successful!`);
    console.log(`   Runtime ID: ${regResult.runtimeId}`);
    
    if (regResult.apiKey) {
      console.log(`   API Key:    ${regResult.apiKey}`);
      console.log(`   ⚠️  IMPORTANT: Add this API Key to your .env file as SYNAPTICRELAY_API_KEY!`);
    }

    // 5. Submit manifest
    console.log(`\n📤 Submitting manifest capabilities...`);
    const manifestResult = await client.submitManifest(regResult.runtimeId, manifest);
    console.log(`✅ Manifest accepted! (Version: ${manifestResult.version})`);

  } catch (err: any) {
    console.error(`\n❌ Failed to register with SynapticRelay: ${err.message}`);
    process.exit(1);
  }

  console.log(`\n🎉 Success! Your bridge is registered.`);
  console.log(`🚀 Next steps: `);
  console.log(`   1. Run 'npm start' or 'npm run dev' to keep the bridge alive.`);
  console.log(`   2. The bridge will now proxy SynapticRelay market traffic to your local OpenClaw agent.`);
}

registerBridge().catch((err) => {
  console.error('Unhandled error during registration:', err);
  process.exit(1);
});
