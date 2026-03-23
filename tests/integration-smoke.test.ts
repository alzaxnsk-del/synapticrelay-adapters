/**
 * Integration Smoke Test
 *
 * Starts the mock server, runs a registration flow against it,
 * and validates the result. This proves the end-to-end path works.
 */

import { SynapticRelayClient, ManifestBuilder, validateManifest } from '../packages/core/src';

// Embedded minimal mock server for test isolation
import * as http from 'http';

function createMockServer(): http.Server {
  let counter = 0;

  return http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');

      const url = req.url || '';
      const method = req.method || 'GET';

      // POST /api/v1/integration/runtimes — register
      if (method === 'POST' && url === '/api/v1/integration/runtimes') {
        counter++;
        res.end(JSON.stringify({
          runtimeId: `rt_smoke_${String(counter).padStart(6, '0')}`,
          apiKey: `srk_smoke_${Math.random().toString(36).substring(2)}`,
          status: 'registered',
        }));
        return;
      }

      // POST /api/v1/integration/runtimes/:id/manifest — submit manifest
      if (method === 'POST' && url.includes('/manifest')) {
        res.end(JSON.stringify({ version: 1, status: 'accepted' }));
        return;
      }

      // POST /api/v1/integration/runtimes/:id/health — health report
      if (method === 'POST' && url.includes('/health')) {
        res.statusCode = 204;
        res.end();
        return;
      }

      // GET /api/v1/integration/runtimes/:id/actions — actions
      if (method === 'GET' && url.includes('/actions')) {
        res.end(JSON.stringify([
          { name: 'publish_service', description: 'Publish a service listing' },
        ]));
        return;
      }

      // GET /api/v1/integration/runtimes/:id/trust — trust
      if (method === 'GET' && url.includes('/trust')) {
        res.end(JSON.stringify({
          verified: false,
          reputationScore: 0,
          completedContracts: 0,
        }));
        return;
      }

      // GET /api/v1/integration/runtimes/:id — get runtime
      if (method === 'GET' && url.match(/\/runtimes\/[^/]+$/)) {
        res.end(JSON.stringify({
          runtimeId: url.split('/').pop(),
          name: 'Smoke Test',
          status: 'active',
          role: 'supplier',
          healthStatus: 'healthy',
        }));
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Not found' }));
    });
  });
}

describe('Integration Smoke Test', () => {
  let server: http.Server;
  let port: number;

  beforeAll((done) => {
    server = createMockServer();
    server.listen(0, () => {
      const addr = server.address();
      port = typeof addr === 'object' && addr ? addr.port : 0;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should complete full registration flow', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}` });

    // 1. Register
    const reg = await client.registerRuntime({
      name: 'Smoke Test Agent',
      type: 'node',
      role: 'supplier',
    });

    expect(reg.runtimeId).toMatch(/^rt_smoke_/);
    expect(reg.apiKey).toMatch(/^srk_smoke_/);

    // 2. Build and validate manifest
    const manifest = new ManifestBuilder('Smoke Test Agent', 'node', '1.0.0')
      .setRole('supplier')
      .healthEndpoint('http://localhost:3000/health')
      .invokeEndpoint('http://localhost:3000/invoke')
      .addCapability({ name: 'test-cap', description: 'Test capability' })
      .build();

    const validationResult = validateManifest(manifest);
    expect(validationResult.valid).toBe(true);

    // 3. Submit manifest
    const manifestResult = await client.submitManifest(reg.runtimeId, manifest);
    expect(manifestResult.version).toBe(1);

    // 4. Report health
    await client.reportHealth(reg.runtimeId, {
      status: 'healthy',
      version: '1.0.0',
    });

    // 5. Get actions
    const actions = await client.getActions(reg.runtimeId);
    expect(actions.length).toBeGreaterThan(0);

    // 6. Get trust
    const trust = await client.getTrust(reg.runtimeId);
    expect(trust).toHaveProperty('verified');
    expect(trust).toHaveProperty('reputationScore');
  });

  it('should complete buyer flow', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}` });

    // Register as buyer
    const reg = await client.registerRuntime({
      name: 'Buyer Smoke Test',
      type: 'node',
      role: 'buyer',
    });

    expect(reg.runtimeId).toBeDefined();

    // Build buyer manifest (no capabilities needed)
    const manifest = new ManifestBuilder('Buyer Smoke Test', 'node', '1.0.0')
      .setRole('buyer')
      .healthEndpoint('http://localhost:3002/health')
      .build();

    const validationResult = validateManifest(manifest);
    expect(validationResult.valid).toBe(true);
  });

  it('should validate manifest before submission catches errors', () => {
    // Supplier without capabilities should fail semantic validation.
    // We construct the manifest as a plain object since ManifestBuilder.build() throws.
    const badManifest = {
      specVersion: '1.0' as const,
      runtime: { name: 'Bad Agent', type: 'node' as const, version: '1.0.0' },
      role: 'supplier' as const,
      endpoints: { health: 'http://localhost:3000/health' },
      // Missing: capabilities (required for supplier)
      // Missing: endpoints.invoke (required for supplier)
    };

    const result = validateManifest(badManifest as any);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
