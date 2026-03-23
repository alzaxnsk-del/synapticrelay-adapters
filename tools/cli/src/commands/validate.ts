import { Command } from 'commander';
import { validateManifestFile } from '@synapticrelay/core';

/**
 * `synapticrelay validate <manifest>` — Validate a manifest JSON file against the adapter spec.
 */
export function validateCommand(): Command {
  return new Command('validate')
    .description('Validate a manifest file against the SynapticRelay adapter spec')
    .argument('<manifest>', 'Path to manifest JSON file')
    .option('--verbose', 'Show detailed validation output')
    .action((manifestPath: string, options: { verbose?: boolean }) => {
      console.info(`\n🔍 Validating: ${manifestPath}\n`);

      try {
        const result = validateManifestFile(manifestPath);

        if (result.valid) {
          console.info('✅ Manifest is valid!\n');
          process.exit(0);
        } else {
          console.error('❌ Manifest validation failed:\n');
          for (const err of result.errors) {
            console.error(`  • ${err.path}: ${err.message}`);
            if (options.verbose && err.keyword) {
              console.error(`    (keyword: ${err.keyword})`);
            }
          }
          console.error(`\n${result.errors.length} error(s) found.\n`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`❌ Error: ${(error as Error).message}\n`);
        process.exit(1);
      }
    });
}
