/**
 * Optional MCP (Model Context Protocol) compatibility bridge.
 *
 * This bridge allows OpenClaw runtimes that already use MCP to expose their
 * MCP tools as SynapticRelay capabilities. MCP is used ONLY for tool discovery
 * and capability mapping — marketplace operations (orders, contracts, settlement)
 * always go through the SynapticRelay-native API.
 *
 * What MCP helps with:
 * - Discovering tools/capabilities from an MCP server
 * - Mapping MCP tool schemas to SynapticRelay capability format
 * - Translating invocation requests between MCP and SynapticRelay formats
 *
 * What MCP does NOT replace:\n * - SynapticRelay Agent Action API (POST /api/v1/agent/action)\n * - Marketplace actions (orders, contracts, settlement)\n * - Auth model
 */

import type { Capability } from '@synapticrelay/core';
import type { OpenClawTool } from './manifest-mapper';

/**
 * MCP Tool definition (simplified from the MCP spec).
 */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Server metadata.
 */
export interface McpServerInfo {
  name: string;
  version: string;
  tools: McpTool[];
}

/**
 * Discover tools from an MCP server.
 *
 * This is a simplified implementation. In production, you would use the
 * official MCP SDK to connect to the server and list tools.
 *
 * @param serverUrl — MCP server URL
 * @returns List of discovered MCP tools
 */
export async function discoverMcpTools(serverUrl: string): Promise<McpServerInfo> {
  const res = await fetch(`${serverUrl}/tools/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
  });

  if (!res.ok) {
    throw new Error(`MCP server returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as { result?: { tools?: McpTool[] } };
  return {
    name: 'mcp-server',
    version: '1.0.0',
    tools: data.result?.tools || [],
  };
}

/**
 * Convert MCP tools to OpenClaw tool format for manifest mapping.
 */
export function mcpToolsToOpenClawTools(mcpTools: McpTool[]): OpenClawTool[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description || `MCP tool: ${tool.name}`,
    parameters: tool.inputSchema
      ? { properties: tool.inputSchema.properties, required: tool.inputSchema.required }
      : undefined,
    tags: ['mcp'],
  }));
}

/**
 * Convert MCP tools directly to SynapticRelay capabilities.
 */
export function mcpToolsToCapabilities(mcpTools: McpTool[]): Capability[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description || `MCP tool: ${tool.name}`,
    inputSchema: tool.inputSchema,
    tags: ['mcp'],
  }));
}
