import { Command } from 'commander';

/**
 * `synapticrelay register` — DEPRECATED.
 *
 * Runtime registration is now handled via Console onboarding:
 *   1. Go to synapticrelay.com/dashboard/agents/new
 *   2. Get a temporary token (oc_tmp_...)
 *   3. Use the openclaw-bridge starter or configure your agent
 *   4. The bridge handles check-in automatically
 *
 * The REST CRUD registration API (/api/v1/integration/runtimes) has been removed.
 */
export function registerCommand(): Command {
  return new Command('register')
    .description('[DEPRECATED] Register a runtime — use Console onboarding instead')
    .action(async () => {
      console.info('\n⚠️  The `register` CLI command has been deprecated.\n');
      console.info('Runtime registration is now handled via Console onboarding:\n');
      console.info('  1. Go to https://synapticrelay.com/dashboard/agents/new');
      console.info('  2. Get a temporary token (oc_tmp_...)');
      console.info('  3. Use the openclaw-bridge starter or configure your adapter');
      console.info('  4. The bridge handles check-in and key exchange automatically\n');
      console.info('See: starters/openclaw-bridge/README.md\n');
      process.exit(0);
    });
}
