/**
 * Mock SynapticRelay Agent API Server
 *
 * A lightweight HTTP server that mimics the unified SynapticRelay Agent API
 * for local testing. All actions go through POST /api/v1/agent/action.
 *
 * Usage:
 *   npx ts-node tests/mock-server.ts
 *
 * The mock server runs on port 9999 by default (configurable via MOCK_PORT env).
 */

import * as http from 'http';

// ─── In-Memory Store ──────────────────────────────────────────────

const orders = new Map<string, { orderId: string; title: string; status: string }>();
const contracts = new Map<string, { contractId: string; orderId: string; supplierId: string; status: string; result?: Record<string, unknown> }>();
let nextOrderId = 1;
let nextContractId = 1;

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

// ─── Action Handlers ──────────────────────────────────────────────

function handleAction(action: string, params: Record<string, unknown>): { status: number; body: unknown } {
  switch (action) {
    case 'search_suppliers':
      return {
        status: 200,
        body: [
          { agentId: 'supplier-mock-1', name: 'Premium Data Service', score: 0.95, price: 0.05, category: params.categoryId || 'general' },
          { agentId: 'supplier-mock-2', name: 'Standard Data Service', score: 0.88, price: 0.01, category: params.categoryId || 'general' },
        ],
      };

    case 'create_order_from_goal': {
      const orderId = `ord_mock_${(nextOrderId++).toString().padStart(4, '0')}`;
      const order = { orderId, title: `Order: ${params.goal}`, status: 'open' };
      orders.set(orderId, order);
      return { status: 201, body: order };
    }

    case 'select_supplier_for_order': {
      const contractId = `ctr_mock_${(nextContractId++).toString().padStart(4, '0')}`;
      const contract = {
        contractId,
        orderId: params.orderId as string,
        supplierId: params.supplierId as string,
        status: 'executing',
      };
      contracts.set(contractId, contract);
      return { status: 200, body: contract };
    }

    case 'submit_result': {
      const contract = contracts.get(params.contractId as string);
      if (!contract) return { status: 404, body: { code: 'NOT_FOUND', message: 'Contract not found' } };
      contract.status = 'result_ready';
      contract.result = params.result as Record<string, unknown>;
      return { status: 200, body: { received: true } };
    }

    case 'get_result': {
      const c = contracts.get(params.contractId as string);
      if (!c) return { status: 404, body: { code: 'NOT_FOUND', message: 'Contract not found' } };
      return {
        status: 200,
        body: {
          resultId: `res_mock_${Date.now()}`,
          contractId: c.contractId,
          data: c.result || {},
          submittedAt: new Date().toISOString(),
        },
      };
    }

    case 'suggest_next_best_action':
      return {
        status: 200,
        body: {
          action: 'search_suppliers',
          reason: 'You have no active orders. Start by searching for suppliers.',
          params: { limit: 10 },
        },
      };

    case 'inspect_contract_state': {
      const ct = contracts.get(params.contractId as string);
      if (!ct) return { status: 404, body: { code: 'NOT_FOUND', message: 'Contract not found' } };
      return {
        status: 200,
        body: {
          contractId: ct.contractId,
          status: ct.status,
          supplierId: ct.supplierId,
          buyerId: 'buyer-mock',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resultReady: ct.status === 'result_ready',
        },
      };
    }

    default:
      return { status: 400, body: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` } };
  }
}

// ─── Request Router ───────────────────────────────────────────────

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method || 'GET';

  // Validate API key
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || !apiKey.startsWith('ac_')) {
    return json(res, 401, { code: 'AUTH_FAILED', message: 'Missing or invalid API key. Expected ac_...' });
  }

  // POST /api/v1/agent/action — the only endpoint
  if (method === 'POST' && path === '/api/v1/agent/action') {
    const body = await parseBody(req);
    const action = body.action as string;
    const params = (body.params as Record<string, unknown>) || {};

    if (!action) {
      return json(res, 400, { code: 'MISSING_ACTION', message: 'action field is required' });
    }

    const result = handleAction(action, params);
    return json(res, result.status, result.body);
  }

  // POST /api/v1/onboarding/check-in — for bridge onboarding
  if (method === 'POST' && path === '/api/v1/onboarding/check-in') {
    const body = await parseBody(req);
    return json(res, 200, {
      data: {
        sessionId: `ses_mock_${Date.now()}`,
        status: 'inspecting',
        apiKey: `ac_mock_${Math.random().toString(36).substring(2, 18)}`,
      },
    });
  }

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
  console.info(`\n🧪 Mock SynapticRelay Agent API server on http://localhost:${PORT}\n`);
  console.info('Endpoints:');
  console.info('  POST /api/v1/agent/action        — All agent actions');
  console.info('  POST /api/v1/onboarding/check-in  — Bridge onboarding');
  console.info('\nActions: search_suppliers, create_order_from_goal, select_supplier_for_order,');
  console.info('         submit_result, get_result, suggest_next_best_action, inspect_contract_state\n');
});

export { server };
