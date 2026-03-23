import type { RuntimeManifest, Capability, RuntimeRole } from '@synapticrelay/core';
import { ManifestBuilder } from '@synapticrelay/core';
import type { OpenClawConfig } from './config';

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
 * Generate a SynapticRelay manifest from OpenClaw agent metadata.
 *
 * @param config — OpenClaw adapter configuration
 * @param tools — OpenClaw tool definitions to map as capabilities
 * @returns A valid RuntimeManifest
 */
export function generateManifest(
  config: OpenClawConfig,
  tools: OpenClawTool[] = [],
): RuntimeManifest {
  const builder = new ManifestBuilder(config.agentName, 'openclaw', config.version || '1.0.0');

  builder
    .setRole(config.role)
    .healthEndpoint(`${config.agentBaseUrl}/health`);

  if (config.description) {
    builder.description(config.description);
  }

  // Supplier / both roles need invoke endpoint and capabilities
  if (config.role === 'supplier' || config.role === 'both') {
    builder.invokeEndpoint(`${config.agentBaseUrl}/invoke`);

    const capabilities = mapToolsToCapabilities(tools);
    for (const cap of capabilities) {
      builder.addCapability(cap);
    }
  }

  // Buyer / both roles may want webhook for callbacks
  if (config.role === 'buyer' || config.role === 'both') {
    builder.webhookEndpoint(`${config.agentBaseUrl}/webhook`);
  }

  if (config.invocationMode) {
    builder.invocation({ mode: config.invocationMode });
  }

  if (config.mcpEnabled) {
    builder.meta({ mcpEnabled: true, mcpServerUrl: config.mcpServerUrl });
  }

  // Build without validation to allow partial manifests during development
  return builder.buildUnchecked();
}

/**
 * Generate a manifest JSON string for easy file output.
 */
export function generateManifestJson(
  config: OpenClawConfig,
  tools: OpenClawTool[] = [],
): string {
  const manifest = generateManifest(config, tools);
  return JSON.stringify(manifest, null, 2);
}
