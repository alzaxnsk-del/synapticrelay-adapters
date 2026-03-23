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
  let manifestPath = path.resolve(__dirname, '../manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log(`⚠️  manifest.json not found locally.`);
    manifestPath = path.resolve(__dirname, `../templates/manifest-${config.role}.json`);
    console.log(`📄 Falling back to default template for role '${config.role}': ${manifestPath}`);
  } else {
    console.log(`📄 Reading manifest from: ${manifestPath}`);
  }
  
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifest file not found at ${manifestPath}.`);
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
  };

  if (config.role === 'supplier' || config.role === 'both') {
    manifest.endpoints.invoke = `${config.agentBaseUrl}/invoke`;
  }
  if (config.role === 'buyer' || config.role === 'both') {
    manifest.endpoints.webhook = `${config.agentBaseUrl}/webhook`;
  }

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
    apiKey: config.connectToken, // The Connect Token acts as the auth key
  });

  try {
    // 4. Submit manifest directly to the known Agent ID
    console.log(`\n📤 Binding endpoints and capabilities to Agent ID: ${config.agentId}`);
    const manifestResult = await client.submitManifest(config.agentId, manifest);
    console.log(`✅ Connection successful! (Manifest Version: ${manifestResult.version})`);

  } catch (err: any) {
    console.error(`\n❌ Failed to connect to SynapticRelay: ${err.message}`);
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
