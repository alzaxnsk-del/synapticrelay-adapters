#!/usr/bin/env node

/**
 * SynapticRelay CLI — adapter development toolkit.
 *
 * Commands:
 *   validate <manifest>   Validate a manifest against the adapter spec
 *   register              Register a runtime with SynapticRelay
 *   health-check          Check a runtime's health endpoint
 *   self-check            Run full pre-deployment validation
 */

import { Command } from 'commander';
import { validateCommand } from './commands/validate';
import { registerCommand } from './commands/register';
import { healthCheckCommand } from './commands/health-check';
import { selfCheckCommand } from './commands/self-check';

const program = new Command();

program
  .name('synapticrelay')
  .description('CLI toolkit for SynapticRelay adapter development')
  .version('0.1.0');

program.addCommand(validateCommand());
program.addCommand(registerCommand());
program.addCommand(healthCheckCommand());
program.addCommand(selfCheckCommand());

program.parse();
