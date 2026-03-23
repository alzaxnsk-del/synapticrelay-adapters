import { Command } from 'commander';

/**
 * `synapticrelay health-check` — Check a runtime's health endpoint compatibility.
 */
export function healthCheckCommand(): Command {
  return new Command('health-check')
    .description('Check if a health endpoint is SynapticRelay-compatible')
    .requiredOption('--url <url>', 'Health endpoint URL to check')
    .option('--timeout <ms>', 'Request timeout in ms', '5000')
    .action(async (options: { url: string; timeout: string }) => {
      console.info(`\n🏥 Checking health endpoint: ${options.url}\n`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), parseInt(options.timeout));

      try {
        const res = await fetch(options.url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        clearTimeout(timeout);

        if (!res.ok) {
          console.error(`❌ Health endpoint returned ${res.status}\n`);
          console.error('   Expected: 200 OK with JSON body\n');
          process.exit(1);
        }

        const body = await res.json() as Record<string, unknown>;
        const checks = [
          { name: 'status field', pass: typeof body.status === 'string' },
          { name: 'valid status value', pass: ['healthy', 'degraded', 'unhealthy'].includes(body.status as string) },
          { name: 'version field', pass: typeof body.version === 'string' },
          { name: 'JSON response', pass: true },
          { name: 'HTTP 200', pass: true },
        ];

        let allPassed = true;
        for (const check of checks) {
          const icon = check.pass ? '✅' : '❌';
          console.info(`  ${icon} ${check.name}`);
          if (!check.pass) allPassed = false;
        }

        console.info('');
        if (allPassed) {
          console.info('✅ Health endpoint is SynapticRelay-compatible!\n');
        } else {
          console.warn('⚠️  Some checks failed. See spec/adapter-spec.md for requirements.\n');
          process.exit(1);
        }

        console.info('Response:');
        console.info(JSON.stringify(body, null, 2));
        console.info('');
      } catch (error) {
        clearTimeout(timeout);
        if ((error as Error).name === 'AbortError') {
          console.error(`❌ Health endpoint timed out after ${options.timeout}ms\n`);
        } else {
          console.error(`❌ Could not reach health endpoint: ${(error as Error).message}\n`);
        }
        process.exit(1);
      }
    });
}
