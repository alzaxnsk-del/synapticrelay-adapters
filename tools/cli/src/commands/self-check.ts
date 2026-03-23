import { Command } from 'commander';
import { validateManifestFile, configFromEnv } from '@synapticrelay/core';

/**
 * `synapticrelay self-check` — Run full pre-deployment validation.
 */
export function selfCheckCommand(): Command {
  return new Command('self-check')
    .description('Run a full pre-deployment self-check for your adapter')
    .option('--manifest <path>', 'Manifest file to validate')
    .option('--health-url <url>', 'Health endpoint URL to check')
    .option('--skip-connection', 'Skip SynapticRelay connection check')
    .action(async (options: {
      manifest?: string;
      healthUrl?: string;
      skipConnection?: boolean;
    }) => {
      console.info('\n🔎 SynapticRelay Adapter Self-Check\n');
      console.info('═'.repeat(50));

      let allPassed = true;

      // 1. Environment check
      console.info('\n📋 Environment Configuration');
      try {
        const config = configFromEnv();
        console.info(`  ✅ SYNAPTICRELAY_URL: ${config.baseUrl}`);
        if (config.apiKey) {
          console.info(`  ✅ API Key: configured`);
        } else {
          console.info(`  ⚠️  API Key: not set (needed for registration)`);
        }
      } catch (error) {
        console.error(`  ❌ ${(error as Error).message}`);
        allPassed = false;
      }

      // 2. Manifest validation
      if (options.manifest) {
        console.info('\n📄 Manifest Validation');
        try {
          const result = validateManifestFile(options.manifest);
          if (result.valid) {
            console.info(`  ✅ Manifest is valid: ${options.manifest}`);
          } else {
            console.error(`  ❌ Manifest is invalid:`);
            for (const err of result.errors) {
              console.error(`     • ${err.path}: ${err.message}`);
            }
            allPassed = false;
          }
        } catch (error) {
          console.error(`  ❌ ${(error as Error).message}`);
          allPassed = false;
        }
      }

      // 3. Health endpoint check
      if (options.healthUrl) {
        console.info('\n🏥 Health Endpoint');
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(options.healthUrl, { signal: controller.signal });
          clearTimeout(timeout);

          if (res.ok) {
            const body = await res.json() as Record<string, unknown>;
            if (body.status && body.version) {
              console.info(`  ✅ Health endpoint OK (status: ${body.status})`);
            } else {
              console.warn(`  ⚠️  Health endpoint missing required fields (status, version)`);
            }
          } else {
            console.error(`  ❌ Health endpoint returned ${res.status}`);
            allPassed = false;
          }
        } catch (error) {
          console.error(`  ❌ Cannot reach health endpoint: ${(error as Error).message}`);
          allPassed = false;
        }
      }

      // 4. Connection check
      if (!options.skipConnection) {
        console.info('\n🌐 SynapticRelay Connection');
        try {
          const config = configFromEnv();
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${config.baseUrl}/api/v1/integration/runtimes`, {
            signal: controller.signal,
            headers: config.apiKey ? { 'X-API-Key': config.apiKey } : {},
          });
          clearTimeout(timeout);

          if (res.status === 401) {
            console.info(`  ⚠️  Connection OK, but authentication required (set API key)`);
          } else if (res.ok) {
            console.info(`  ✅ Connected to SynapticRelay`);
          } else {
            console.warn(`  ⚠️  SynapticRelay returned ${res.status}`);
          }
        } catch (error) {
          console.warn(`  ⚠️  Cannot reach SynapticRelay: ${(error as Error).message}`);
          console.info(`     This is OK for local development — use the mock server.`);
        }
      }

      // Summary
      console.info('\n' + '═'.repeat(50));
      if (allPassed) {
        console.info('\n✅ All checks passed! Your adapter is ready.\n');
      } else {
        console.error('\n❌ Some checks failed. Fix the issues above and try again.\n');
        process.exit(1);
      }
    });
}
