/**
 * Integration Smoke Test — Definitive Action List
 */

import { SynapticRelayClient } from '../packages/core/src';
import * as http from 'http';

function createMockServer(): http.Server {
  let orderCounter = 0;
  let runCounter = 0;
  let payoutCounter = 0;
  const runs = new Map<string, Record<string, unknown>>();

  return http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.method !== 'POST' || req.url !== '/api/v1/agent/action') {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: 'Not found' }));
        return;
      }

      const parsed = body ? JSON.parse(body) : {};
      const action = parsed.action;
      const params = parsed.params || {};

      switch (action) {
        case 'search_suppliers':
          return res.end(JSON.stringify([{ agentId: 'sup-1', name: 'Test', score: 0.95, price: 0.05 }]));

        case 'create_order_from_goal':
          orderCounter++;
          return res.end(JSON.stringify({ orderId: `ord_${orderCounter}`, title: `Order: ${params.goal}`, status: 'open', matchCount: 1 }));

        case 'find_suppliers_for_order':
          return res.end(JSON.stringify([{ agentId: 'sup-1', name: 'Test', score: 0.95 }]));

        case 'select_supplier_for_order': {
          runCounter++;
          payoutCounter++;
          const runId = `run_${runCounter}`;
          runs.set(runId, { runId, orderId: params.orderId, supplierAgentId: params.supplierAgentId, buyerAgentId: 'buyer', status: 'queued' });
          return res.end(JSON.stringify({ runId, payoutId: `pay_${payoutCounter}`, runStatus: 'queued', payoutStatus: 'held' }));
        }

        case 'get_supplier_runs': {
          const agentId = params.supplierAgentId;
          const statusFilter = params.status;
          const filtered = [...runs.values()].filter(r => r.supplierAgentId === agentId && (!statusFilter || r.status === statusFilter));
          return res.end(JSON.stringify(filtered));
        }

        case 'start_run': {
          const r = runs.get(params.runId);
          if (!r) { res.statusCode = 404; return res.end(JSON.stringify({ code: 'NOT_FOUND' })); }
          r.status = 'running';
          return res.end(JSON.stringify(r));
        }

        case 'deliver_result': {
          const r = runs.get(params.runId);
          if (!r) { res.statusCode = 404; return res.end(JSON.stringify({ code: 'NOT_FOUND' })); }
          r.status = 'delivered';
          r.deliveryPayload = params.deliveryPayload;
          return res.end(JSON.stringify({ received: true }));
        }

        case 'inspect_deal_state': {
          const r = runs.get(params.contractId);
          if (!r) { res.statusCode = 404; return res.end(JSON.stringify({ code: 'NOT_FOUND' })); }
          return res.end(JSON.stringify({ run: r, payout: { payoutId: 'pay_1', orderId: r.orderId, status: 'held' } }));
        }

        case 'request_review':
          return res.end(JSON.stringify({ reviewRequested: true }));

        case 'suggest_next_best_action':
          return res.end(JSON.stringify({ action: 'search_suppliers', reason: 'Start searching' }));

        default:
          res.statusCode = 400;
          return res.end(JSON.stringify({ code: 'UNKNOWN_ACTION' }));
      }
    });
  });
}

describe('Integration Smoke Test — Definitive API', () => {
  let server: http.Server;
  let port: number;

  beforeAll((done) => {
    server = createMockServer();
    server.listen(0, () => { port = (server.address() as any).port; done(); });
  });
  afterAll((done) => { server.close(done); });

  it('full buyer flow: create → find → select → inspect', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}`, apiKey: 'ac_smoke' });

    const suppliers = await client.searchSuppliers({ query: 'test' });
    expect(suppliers.length).toBeGreaterThan(0);

    const order = await client.createOrderFromGoal({ goal: 'Smoke test', category: 'test', deadline: '2026-04-01' });
    expect(order.orderId).toBeDefined();
    expect(order.matchCount).toBeDefined();

    const candidates = await client.findSuppliersForOrder({ orderId: order.orderId });
    expect(candidates.length).toBeGreaterThan(0);

    const { runId, payoutId, runStatus, payoutStatus } = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierAgentId: candidates[0].agentId,
    });
    expect(runId).toBeDefined();
    expect(payoutId).toBeDefined();
    expect(runStatus).toBe('queued');
    expect(payoutStatus).toBe('held');

    const deal = await client.inspectDealState({ contractId: runId });
    expect(deal.run).toBeDefined();
    expect(deal.payout).toBeDefined();
  });

  it('full supplier flow: poll → start → deliver', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}`, apiKey: 'ac_smoke' });

    // First create a run via buyer flow
    const order = await client.createOrderFromGoal({ goal: 'Supplier test' });
    const { runId } = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierAgentId: 'sup-1',
    });

    // Supplier polls
    const queuedRuns = await client.getSupplierRuns({ supplierAgentId: 'sup-1', status: 'queued' });
    expect(queuedRuns.length).toBeGreaterThan(0);

    // Start & deliver
    const started = await client.startRun({ runId });
    expect(started.status).toBe('running');

    await client.deliverResult({ runId, deliveryPayload: { answer: '42' } });

    const deal = await client.inspectDealState({ contractId: runId });
    expect(deal.run.status).toBe('delivered');
  });

  it('request review', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}`, apiKey: 'ac_smoke' });
    await client.requestReview({ orderId: 'ord_1', reasonCode: 'quality', comment: 'Incomplete' });
  });

  it('suggest next best action with context', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}`, apiKey: 'ac_smoke' });
    const suggestion = await client.suggestNextBestAction({ context: 'just started' });
    expect(suggestion.action).toBeDefined();
  });
});
