/**
 * Mock SynapticRelay Integration Surface Server
 *
 * A lightweight HTTP server that mimics the SynapticRelay API for local testing.
 * Supports: runtime registration, manifest submission, health reporting, and
 * basic marketplace actions.
 *
 * Usage:
 *   npx ts-node tests/mock-server.ts
 *   # or
 *   node tests/mock-server.js
 *
 * The mock server runs on port 9999 by default (configurable via MOCK_PORT env).
 */

import * as http from 'http';

interface MockRuntime {
  id: string;
  name: string;
  type: string;
  role: string;
  description?: string;
  status: string;
  healthStatus: string;
  apiKey: string;
  manifest?: Record<string, unknown>;
  manifestVersion: number;
  createdAt: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────

const runtimes = new Map<string, MockRuntime>();
let nextId = 1;

function generateId(): string {
  return `rt_mock_${(nextId++).toString().padStart(6, '0')}`;
}

function generateApiKey(): string {
  return `srk_mock_${Math.random().toString(36).substring(2, 18)}`;
}

// ─── Request Handling ─────────────────────────────────────────────

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function json(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method || 'GET';

  // ── POST /api/v1/integration/runtimes ──
  if (method === 'POST' && path === '/api/v1/integration/runtimes') {
    const body = await parseBody(req);
    const runtime: MockRuntime = {
      id: generateId(),
      name: body.name as string,
      type: body.type as string,
      role: body.role as string,
      description: body.description as string | undefined,
      status: 'active',
      healthStatus: 'unknown',
      apiKey: generateApiKey(),
      manifestVersion: 0,
      createdAt: new Date().toISOString(),
    };
    runtimes.set(runtime.id, runtime);
    return json(res, 201, {
      runtimeId: runtime.id,
      apiKey: runtime.apiKey,
      createdAt: runtime.createdAt,
    });
  }

  // ── GET /api/v1/integration/runtimes ──
  if (method === 'GET' && path === '/api/v1/integration/runtimes') {
    return json(res, 200, Array.from(runtimes.values()).map(({ apiKey: _, ...r }) => r));
  }

  // ── Runtime-specific routes ──
  const runtimeMatch = path.match(/^\/api\/v1\/integration\/runtimes\/([^/]+)(\/.*)?$/);
  if (runtimeMatch) {
    const runtimeId = runtimeMatch[1];
    const subPath = runtimeMatch[2] || '';
    const runtime = runtimes.get(runtimeId);

    if (!runtime) {
      return json(res, 404, { code: 'NOT_FOUND', message: 'Runtime not found' });
    }

    // GET /runtimes/:id
    if (method === 'GET' && !subPath) {
      const { apiKey: _, ...details } = runtime;
      return json(res, 200, details);
    }

    // DELETE /runtimes/:id
    if (method === 'DELETE' && !subPath) {
      runtimes.delete(runtimeId);
      return json(res, 204, null);
    }

    // POST /runtimes/:id/manifest
    if (method === 'POST' && subPath === '/manifest') {
      const manifest = await parseBody(req);
      runtime.manifest = manifest;
      runtime.manifestVersion++;
      return json(res, 200, { version: runtime.manifestVersion });
    }

    // GET /runtimes/:id/manifest
    if (method === 'GET' && subPath === '/manifest') {
      return json(res, 200, { ...runtime.manifest, version: runtime.manifestVersion });
    }

    // POST /runtimes/:id/health
    if (method === 'POST' && subPath === '/health') {
      const body = await parseBody(req);
      runtime.healthStatus = body.status as string;
      return json(res, 200, { received: true });
    }

    // GET /runtimes/:id/health
    if (method === 'GET' && subPath === '/health') {
      return json(res, 200, {
        healthStatus: runtime.healthStatus,
        lastCheckAt: new Date().toISOString(),
      });
    }

    // POST /runtimes/:id/role
    if (method === 'POST' && subPath === '/role') {
      const body = await parseBody(req);
      runtime.role = body.role as string;
      const { apiKey: _, ...details } = runtime;
      return json(res, 200, details);
    }

    // GET /runtimes/:id/actions
    if (method === 'GET' && subPath === '/actions') {
      const supplierActions = [
        { name: 'publish_service', description: 'Publish a service listing', method: 'POST', path: '/api/v1/market/services', available: true },
        { name: 'view_contracts', description: 'View incoming contracts', method: 'GET', path: `/api/v1/integration/runtimes/${runtimeId}/contracts`, available: true },
      ];
      const buyerActions = [
        { name: 'create_order', description: 'Create a marketplace order', method: 'POST', path: '/api/v1/market/orders', available: true },
        { name: 'view_shortlist', description: 'View matching suppliers', method: 'GET', path: '/api/v1/market/orders/:id/shortlist', available: true },
      ];
      let actions = runtime.role === 'supplier' ? supplierActions :
                    runtime.role === 'buyer' ? buyerActions :
                    [...supplierActions, ...buyerActions];
      return json(res, 200, actions);
    }

    // GET /runtimes/:id/trust
    if (method === 'GET' && subPath === '/trust') {
      return json(res, 200, {
        verified: false,
        reputationScore: 0,
        totalContracts: 0,
        completedContracts: 0,
        disputes: 0,
      });
    }

    // GET /runtimes/:id/contracts
    if (method === 'GET' && subPath === '/contracts') {
      return json(res, 200, []);
    }
  }

  // ── Marketplace routes ──

  // POST /api/v1/market/services
  if (method === 'POST' && path === '/api/v1/market/services') {
    return json(res, 201, { serviceId: `svc_mock_${Date.now()}` });
  }

  // POST /api/v1/market/orders
  if (method === 'POST' && path === '/api/v1/market/orders') {
    return json(res, 201, { orderId: `ord_mock_${Date.now()}` });
  }

  // GET /api/v1/market/orders/:id/shortlist
  const shortlistMatch = path.match(/^\/api\/v1\/market\/orders\/([^/]+)\/shortlist$/);
  if (method === 'GET' && shortlistMatch) {
    return json(res, 200, [
      { agentId: 'agent_mock_001', score: 0.95, name: 'Top Supplier Agent' },
      { agentId: 'agent_mock_002', score: 0.87, name: 'Good Supplier Agent' },
    ]);
  }

  // POST /api/v1/market/orders/:id/shortlist (select)
  if (method === 'POST' && shortlistMatch) {
    return json(res, 200, { contractId: `ctr_mock_${Date.now()}` });
  }

  // POST /api/v1/market/contracts
  if (method === 'POST' && path === '/api/v1/market/contracts') {
    return json(res, 201, { contractId: `ctr_mock_${Date.now()}` });
  }

  // GET /api/v1/market/contracts/:id/receipt
  const receiptMatch = path.match(/^\/api\/v1\/market\/contracts\/([^/]+)\/receipt$/);
  if (method === 'GET' && receiptMatch) {
    return json(res, 200, {
      contractId: receiptMatch[1],
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }

  // Default 404
  json(res, 404, { code: 'NOT_FOUND', message: `${method} ${path} not found` });
}

// ─── Server ───────────────────────────────────────────────────────

const PORT = parseInt(process.env.MOCK_PORT || '9999');

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (error) {
    json(res, 500, { code: 'INTERNAL_ERROR', message: (error as Error).message });
  }
});

server.listen(PORT, () => {
  console.info(`\n🧪 Mock SynapticRelay server running on http://localhost:${PORT}\n`);
  console.info('Available endpoints:');
  console.info('  POST   /api/v1/integration/runtimes          — Register runtime');
  console.info('  GET    /api/v1/integration/runtimes          — List runtimes');
  console.info('  GET    /api/v1/integration/runtimes/:id      — Get runtime');
  console.info('  DELETE /api/v1/integration/runtimes/:id      — Delete runtime');
  console.info('  POST   /api/v1/integration/runtimes/:id/manifest — Submit manifest');
  console.info('  GET    /api/v1/integration/runtimes/:id/manifest — Get manifest');
  console.info('  POST   /api/v1/integration/runtimes/:id/health   — Report health');
  console.info('  GET    /api/v1/integration/runtimes/:id/health   — Get health');
  console.info('  POST   /api/v1/integration/runtimes/:id/role     — Change role');
  console.info('  GET    /api/v1/integration/runtimes/:id/actions  — Get actions');
  console.info('  GET    /api/v1/integration/runtimes/:id/trust    — Get trust');
  console.info('  GET    /api/v1/integration/runtimes/:id/contracts — Get contracts');
  console.info('  POST   /api/v1/market/services                — Publish service');
  console.info('  POST   /api/v1/market/orders                  — Create order');
  console.info('  GET    /api/v1/market/orders/:id/shortlist    — Get shortlist');
  console.info('  POST   /api/v1/market/contracts               — Open contract');
  console.info('  GET    /api/v1/market/contracts/:id/receipt   — Get receipt');
  console.info('');
});

export { server };
