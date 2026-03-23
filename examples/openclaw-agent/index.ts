/**
 * Example: OpenClaw Agent Integration
 *
 * Shows how to connect an OpenClaw agent to SynapticRelay using the adapter.
 *
 * Run:
 *   export SYNAPTICRELAY_URL=http://localhost:9999
 *   export OPENCLAW_AGENT_NAME="My OpenClaw Agent"
 *   export OPENCLAW_AGENT_URL=http://localhost:4000
 *   export OPENCLAW_ROLE=supplier
 *   npx ts-node examples/openclaw-agent/index.ts
 */

import { OpenClawConnector } from '../../adapters/openclaw/src';
import type { OpenClawTool } from '../../adapters/openclaw/src';

async function main() {
  console.info('🐾 OpenClaw Agent Example\n');

  const connector = new OpenClawConnector({
    synapticRelayUrl: process.env.SYNAPTICRELAY_URL || 'http://localhost:9999',
    agentName: 'OpenClaw Research Agent',
    agentBaseUrl: 'http://localhost:4000',
    role: 'supplier',
    description: 'Research and analysis agent powered by OpenClaw',
    version: '1.0.0',
  });

  // Define OpenClaw tools
  const tools: OpenClawTool[] = [
    {
      name: 'web-research',
      description: 'Research a topic by searching the web',
      parameters: {
        properties: {
          query: { type: 'string', description: 'Search query' },
          depth: { type: 'string', enum: ['shallow', 'deep'] },
        },
        required: ['query'],
      },
      category: 'research',
      tags: ['search', 'web', 'analysis'],
    },
    {
      name: 'summarize-findings',
      description: 'Compile and summarize research findings',
      parameters: {
        properties: {
          topic: { type: 'string' },
          format: { type: 'string', enum: ['brief', 'detailed', 'executive'] },
        },
      },
      category: 'research',
      tags: ['summarization', 'report'],
    },
  ];

  // Register with tools mapped as capabilities
  console.info('1. Registering with SynapticRelay...');
  const result = await connector.register(tools);
  console.info(`   Runtime ID: ${result.runtimeId}\n`);

  // Report health
  console.info('2. Reporting healthy...');
  await connector.reportHealthy(['web-research', 'summarize-findings']);

  // Publish service
  console.info('3. Publishing service...');
  const service = await connector.publishService({
    title: 'AI Research & Analysis',
    description: 'Deep web research and summarization',
    category: 'research',
  });
  console.info(`   Service ID: ${service.serviceId}\n`);

  // Check state
  console.info('4. Checking runtime state...');
  const details = await connector.getDetails();
  console.info(`   Status: ${details.status}`);
  console.info(`   Health: ${details.healthStatus}`);
  console.info(`   Role: ${details.role}\n`);

  const actions = await connector.getActions();
  console.info('5. Available actions:');
  for (const action of actions) {
    console.info(`   • ${action.name}`);
  }

  console.info('\n✅ OpenClaw agent connected to SynapticRelay!\n');
}

main().catch(console.error);
