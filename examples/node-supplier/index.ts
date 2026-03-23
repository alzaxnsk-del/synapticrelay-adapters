/**
 * Example: Node/TypeScript Supplier Agent
 *
 * Uses the Node adapter's connector and middleware to create a full supplier.
 *
 * Run:
 *   export SYNAPTICRELAY_URL=http://localhost:9999
 *   npx ts-node examples/node-supplier/index.ts
 */

import { SynapticRelayConnector } from '../../adapters/node/src';

async function main() {
  console.info('📦 Node Supplier Agent Example\n');

  const connector = new SynapticRelayConnector({
    synapticRelayUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    agentName: 'Node Data Processor',
    agentBaseUrl: 'http://localhost:3001',
    role: 'supplier',
    description: 'High-performance data processing agent',
    version: '1.0.0',
  });

  // Register with capabilities
  console.info('1. Registering...');
  const result = await connector.register([
    { name: 'parse-csv', description: 'Parse and analyze CSV files' },
    { name: 'transform-data', description: 'Transform data between formats' },
  ]);
  console.info(`   Runtime ID: ${result.runtimeId}\n`);

  // Report health
  console.info('2. Reporting health...');
  await connector.reportHealthy(['parse-csv', 'transform-data']);

  // Publish service
  console.info('3. Publishing service...');
  await connector.publishService({
    title: 'Data Processing Pipeline',
    description: 'CSV parsing and data transformation',
    category: 'data',
  });

  // Get runtime details
  console.info('4. Runtime details:');
  const details = await connector.getDetails();
  console.info(`   Status: ${details.status}`);
  console.info(`   Health: ${details.healthStatus}`);

  console.info('\n✅ Node supplier agent operational!\n');
}

main().catch(console.error);
