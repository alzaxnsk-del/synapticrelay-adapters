/**
 * Mock SynapticRelay Agent API Server — Definitive Action List
 *
 * All actions go through POST /api/v1/agent/action.
 * Usage: npx ts-node tests/mock-server.ts
 */

import * as http from 'http';

const orders = new Map<string, { orderId: string; title: string; status: string; matchCount: number }>();
const runs = new Map<string, { runId: string; orderId: string; supplierAgentId: string; buyerAgentId: string; status: string; deliveryPayload?: Record<string, unknown> }>();
const payouts = new Map<string, { payoutId: string; orderId: string; status: string; autoReleaseAt?: string }>();

let nextOrderId = 1;
let nextRunId = 1;
let nextPayoutId = 1;

function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk));
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function json(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function handleAction(action: string, params: Record<string, unknown>): { status: number; body: unknown } {
  switch (action) {
    // ─── Buyer ───────────────────────────────────────────────────
    case 'search_suppliers':
      return { status: 200, body: [
        { agentId: 'supplier-mock-1', name: 'Premium Data Service', score: 0.95, price: 0.05 },
        { agentId: 'supplier-mock-2', name: 'Standard Data Service', score: 0.88, price: 0.01 },
      ]};

    case 'create_order_from_goal': {
      const orderId = `ord_mock_${(nextOrderId++).toString().padStart(4, '0')}`;
      const order = { orderId, title: `Order: ${params.goal}`, status: 'open', matchCount: 2 };
      orders.set(orderId, order);
      return { status: 201, body: order };
    }

    case 'find_suppliers_for_order': {
      const orderId = params.orderId as string;
      if (!orders.has(orderId)) return { status: 404, body: { code: 'NOT_FOUND', message: 'Order not found' } };
      return { status: 200, body: [
        { agentId: 'supplier-mock-1', name: 'Premium Data Service', score: 0.95, price: 0.05 },
      ]};
    }

    case 'select_supplier_for_order': {
      const runId = `run_mock_${(nextRunId++).toString().padStart(4, '0')}`;
      const payoutId = `pay_mock_${(nextPayoutId++).toString().padStart(4, '0')}`;
      runs.set(runId, { runId, orderId: params.orderId as string, supplierAgentId: params.supplierAgentId as string, buyerAgentId: 'buyer-mock', status: 'queued' });
      payouts.set(payoutId, { payoutId, orderId: params.orderId as string, status: 'held' });
      return { status: 200, body: { runId, payoutId, runStatus: 'queued', payoutStatus: 'held' } };
    }

    case 'request_review':
      return { status: 200, body: { reviewRequested: true } };

    // ─── Supplier ────────────────────────────────────────────────
    case 'get_supplier_runs': {
      const agentId = params.supplierAgentId as string;
      const statusFilter = params.status as string | undefined;
      const filtered = [...runs.values()].filter(r => r.supplierAgentId === agentId && (!statusFilter || r.status === statusFilter));
      return { status: 200, body: filtered };
    }

    case 'start_run': {
      const run = runs.get(params.runId as string);
      if (!run) return { status: 404, body: { code: 'NOT_FOUND', message: 'Run not found' } };
      run.status = 'running';
      return { status: 200, body: run };
    }

    case 'deliver_result': {
      const run = runs.get(params.runId as string);
      if (!run) return { status: 404, body: { code: 'NOT_FOUND', message: 'Run not found' } };
      run.status = 'delivered';
      run.deliveryPayload = params.deliveryPayload as Record<string, unknown>;
      return { status: 200, body: { received: true } };
    }

    // ─── Shared ──────────────────────────────────────────────────
    case 'inspect_deal_state': {
      const contractId = params.contractId as string; // contractId === runId
      const run = runs.get(contractId);
      if (!run) return { status: 404, body: { code: 'NOT_FOUND', message: 'Run not found' } };
      const payout = [...payouts.values()].find(p => p.orderId === run.orderId);
      return { status: 200, body: { run, payout: payout || null } };
    }

    case 'suggest_next_best_action':
      return { status: 200, body: { action: 'search_suppliers', reason: 'Start by finding suppliers.', params: { limit: 10 } } };

    default:
      return { status: 400, body: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` } };
  }
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const method = req.method || 'GET';

  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || !apiKey.startsWith('ac_')) {
    return json(res, 401, { code: 'AUTH_FAILED', message: 'Missing or invalid API key' });
  }

  if (method === 'POST' && url.pathname === '/api/v1/agent/action') {
    const body = await parseBody(req);
    const action = body.action as string;
    if (!action) return json(res, 400, { code: 'MISSING_ACTION', message: 'action field is required' });
    const result = handleAction(action, (body.params as Record<string, unknown>) || {});
    return json(res, result.status, result.body);
  }

  if (method === 'POST' && url.pathname === '/api/v1/onboarding/check-in') {
    return json(res, 200, { data: { sessionId: `ses_mock_${Date.now()}`, status: 'inspecting', apiKey: `ac_mock_${Math.random().toString(36).substring(2, 18)}` } });
  }

  json(res, 404, { code: 'NOT_FOUND', message: `${method} ${url.pathname} not found` });
}

const PORT = parseInt(process.env.MOCK_PORT || '9999');

const server = http.createServer(async (req, res) => {
  try { await handleRequest(req, res); }
  catch (error) { json(res, 500, { code: 'INTERNAL_ERROR', message: (error as Error).message }); }
});

server.listen(PORT, () => {
  console.info(`\n🧪 Mock SynapticRelay Agent API on http://localhost:${PORT}\n`);
  console.info('Buyer:    search_suppliers, create_order_from_goal, find_suppliers_for_order, select_supplier_for_order, request_review');
  console.info('Supplier: get_supplier_runs, start_run, deliver_result');
  console.info('Shared:   inspect_deal_state, suggest_next_best_action\n');
});

export { server };
