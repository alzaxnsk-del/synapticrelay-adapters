import { Command } from 'commander';
import { SynapticRelayClient, configFromEnv } from '@synapticrelay/core';
import type { RuntimeRole, RuntimeType } from '@synapticrelay/core';

/**
 * `synapticrelay register` — Register a runtime with SynapticRelay.
 */
export function registerCommand(): Command {
  return new Command('register')
    .description('Register a new runtime with SynapticRelay')
    .requiredOption('--name <name>', 'Runtime display name')
    .requiredOption('--type <type>', 'Runtime type (openclaw, python, node, mcp, http, custom)')
    .requiredOption('--role <role>', 'Runtime role (supplier, buyer, both)')
    .option('--description <desc>', 'Runtime description')
    .option('--manifest <path>', 'Manifest JSON file to submit after registration')
    .action(async (options: {
      name: string;
      type: string;
      role: string;
      description?: string;
      manifest?: string;
    }) => {
      console.info('\n🚀 Registering runtime with SynapticRelay...\n');

      try {
        const config = configFromEnv();
        const client = new SynapticRelayClient(config);

        const result = await client.registerRuntime({
          name: options.name,
          type: options.type as RuntimeType,
          role: options.role as RuntimeRole,
          description: options.description,
        });

        console.info('✅ Registration successful!\n');
        console.info(`  Runtime ID: ${result.runtimeId}`);
        console.info(`  API Key:    ${result.apiKey}`);
        console.info(`  Created:    ${result.createdAt}\n`);

        // Submit manifest if provided
        if (options.manifest) {
          console.info(`📋 Submitting manifest: ${options.manifest}...\n`);
          const fs = await import('fs');
          const manifestData = JSON.parse(fs.readFileSync(options.manifest, 'utf-8'));
          const manifestResult = await client.submitManifest(result.runtimeId, manifestData);
          console.info(`✅ Manifest submitted (version ${manifestResult.version})\n`);
        }

        console.info('📝 Save your API key — you will need it for future requests:');
        console.info(`   export SYNAPTICRELAY_API_KEY=${result.apiKey}\n`);
      } catch (error) {
        console.error(`❌ Registration failed: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
