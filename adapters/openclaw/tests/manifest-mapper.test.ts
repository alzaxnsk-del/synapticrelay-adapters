import { generateManifest, mapToolsToCapabilities, type OpenClawTool } from '../src/manifest-mapper';
import type { OpenClawConfig } from '../src/config';

describe('OpenClaw Manifest Mapper', () => {
  it('should map tools to capabilities correctly', () => {
    const tools: OpenClawTool[] = [
      {
        name: 'test_tool',
        description: 'A test tool',
        parameters: { properties: { arg1: { type: 'string' } } },
      },
    ];

    const capabilities = mapToolsToCapabilities(tools);

    expect(capabilities).toHaveLength(1);
    expect(capabilities[0].name).toBe('test_tool');
    expect(capabilities[0].description).toBe('A test tool');
    expect(capabilities[0].inputSchema).toEqual({
      type: 'object',
      properties: { arg1: { type: 'string' } },
    });
  });

  it('should generate a valid supplier manifest', () => {
    const config: OpenClawConfig = {
      synapticRelayUrl: 'http://localhost:9999',
      agentName: 'Test Agent',
      agentBaseUrl: 'http://localhost:3000',
      role: 'supplier',
      version: '1.2.3',
    };

    const tools: OpenClawTool[] = [
      { name: 'test_tool', description: 'A test tool' },
    ];

    const manifest = generateManifest(config, tools);

    expect(manifest.specVersion).toBe('1.0');
    expect(manifest.runtime.name).toBe('Test Agent');
    expect(manifest.runtime.version).toBe('1.2.3');
    expect(manifest.role).toBe('supplier');
    expect(manifest.endpoints.health).toBe('http://localhost:3000/health');
    expect(manifest.endpoints.invoke).toBe('http://localhost:3000/invoke');
    expect(manifest.capabilities).toHaveLength(1);
    expect(manifest.capabilities?.[0].name).toBe('test_tool');
  });

  it('should generate a valid buyer manifest without invoke endpoints or capabilities', () => {
    const config: OpenClawConfig = {
      synapticRelayUrl: 'http://localhost:9999',
      agentName: 'Buyer Agent',
      agentBaseUrl: 'http://localhost:4000',
      role: 'buyer',
    };

    const manifest = generateManifest(config, []);

    expect(manifest.role).toBe('buyer');
    expect(manifest.endpoints.health).toBe('http://localhost:4000/health');
    expect(manifest.endpoints.invoke).toBeUndefined(); // Buyers don't have invoke endpoints
    expect(manifest.endpoints.webhook).toBe('http://localhost:4000/webhook'); // Buyers expect webhook
    expect(manifest.capabilities).toBeUndefined(); // Buyers don't expose capabilities
  });
});
