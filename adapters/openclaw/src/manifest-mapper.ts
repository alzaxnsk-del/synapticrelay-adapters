import type { RuntimeManifest, Capability } from '@synapticrelay/core';
import { ManifestBuilder } from '@synapticrelay/core';

/**
 * OpenClaw tool definition (subset of the OpenClaw tool format).
 * Maps OpenClaw tool declarations to SynapticRelay capabilities.
 */
export interface OpenClawTool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  returns?: Record<string, unknown>;
  category?: string;
  tags?: string[];
}

/**
 * Map an array of OpenClaw tool definitions to SynapticRelay capabilities.
 */
export function mapToolsToCapabilities(tools: OpenClawTool[]): Capability[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.parameters
      ? { type: 'object' as const, ...tool.parameters }
      : undefined,
    outputSchema: tool.returns
      ? { type: 'object' as const, ...tool.returns }
      : undefined,
    category: tool.category,
    tags: tool.tags,
  }));
}

/**
 * Generate a SynapticRelay manifest from OpenClaw tools.
 *
 * Since OpenClawConfig is now minimal (just URL + key),
 * you provide agent metadata directly to this function.
 */
export function generateManifest(
  agentMeta: {
    name: string;
    version?: string;
    role?: 'supplier' | 'buyer' | 'both';
    baseUrl?: string;
    description?: string;
  },
  tools: OpenClawTool[] = [],
): RuntimeManifest {
  const builder = new ManifestBuilder(agentMeta.name, 'openclaw', agentMeta.version || '1.0.0');
  const role = agentMeta.role || 'supplier';

  builder
    .setRole(role)
    .healthEndpoint(`${agentMeta.baseUrl || 'http://localhost:3000'}/health`);

  if (agentMeta.description) {
    builder.description(agentMeta.description);
  }

  if (role === 'supplier' || role === 'both') {
    builder.invokeEndpoint(`${agentMeta.baseUrl || 'http://localhost:3000'}/invoke`);
    const capabilities = mapToolsToCapabilities(tools);
    for (const cap of capabilities) {
      builder.addCapability(cap);
    }
  }

  if (role === 'buyer' || role === 'both') {
    builder.webhookEndpoint(`${agentMeta.baseUrl || 'http://localhost:3000'}/webhook`);
  }

  return builder.buildUnchecked();
}

/**
 * Generate a manifest JSON string for easy file output.
 */
export function generateManifestJson(
  agentMeta: Parameters<typeof generateManifest>[0],
  tools: OpenClawTool[] = [],
): string {
  const manifest = generateManifest(agentMeta, tools);
  return JSON.stringify(manifest, null, 2);
}
