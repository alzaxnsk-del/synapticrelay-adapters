/**
 * Integration Smoke Test — Order-Workflow Model
 *
 * Starts a minimal mock server and verifies the full
 * order → select → startRun → deliverResult → getRunDetails flow.
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
      const method = req.method || 'GET';
      const url = req.url || '';

      if (method === 'POST' && url === '/api/v1/agent/action') {
        const parsed = body ? JSON.parse(body) : {};
        const action = parsed.action;
        const params = parsed.params || {};

        switch (action) {
          case 'search_suppliers':
            res.end(JSON.stringify([{ agentId: 'sup-1', name: 'Test', score: 0.95, price: 0.05 }]));
            return;

          case 'create_order_from_goal':
            orderCounter++;
            res.end(JSON.stringify({ orderId: `ord_smoke_${orderCounter}`, title: `Order: ${params.goal}`, status: 'open', matchCount: 1 }));
            return;

          case 'select_supplier_for_order':
            runCounter++;
            payoutCounter++;
            const runId = `run_smoke_${runCounter}`;
            runs.set(runId, { runId, orderId: params.orderId, supplierAgentId: params.supplierId, buyerAgentId: 'buyer', status: 'awaiting_start' });
            res.end(JSON.stringify({ runId, payoutId: `pay_smoke_${payoutCounter}`, runStatus: 'awaiting_start', payoutStatus: 'held' }));
            return;

          case 'start_run': {
            const r = runs.get(params.runId);
            if (!r) { res.statusCode = 404; res.end(JSON.stringify({ code: 'NOT_FOUND' })); return; }
            r.status = 'in_progress';
            res.end(JSON.stringify(r));
            return;
          }

          case 'deliver_result': {
            const r = runs.get(params.runId);
            if (!r) { res.statusCode = 404; res.end(JSON.stringify({ code: 'NOT_FOUND' })); return; }
            r.status = 'delivered';
            r.deliveryPayload = params.deliveryPayload;
            res.end(JSON.stringify({ received: true }));
            return;
          }

          case 'get_run_details': {
            const r = runs.get(params.runId);
            if (!r) { res.statusCode = 404; res.end(JSON.stringify({ code: 'NOT_FOUND' })); return; }
            res.end(JSON.stringify(r));
            return;
          }

          case 'cancel_order':
            res.end(JSON.stringify({ cancelled: true }));
            return;

          case 'request_review':
            res.end(JSON.stringify({ reviewRequested: true }));
            return;

          case 'suggest_next_best_action':
            res.end(JSON.stringify({ action: 'search_suppliers', reason: 'Start by searching' }));
            return;

          case 'inspect_deal_state': {
            const r = [...runs.values()].find(r => r.orderId === params.orderId);
            if (!r) { res.statusCode = 404; res.end(JSON.stringify({ code: 'NOT_FOUND' })); return; }
            res.end(JSON.stringify(r));
            return;
          }

          default:
            res.statusCode = 400;
            res.end(JSON.stringify({ code: 'UNKNOWN_ACTION', message: `Unknown: ${action}` }));
            return;
        }
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Not found' }));
    });
  });
}

describe('Integration Smoke Test — Order-Workflow', () => {
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

  afterAll((done) => { server.close(done); });

  it('should complete full buyer flow: order → select → startRun → deliverResult', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}`, apiKey: 'ac_smoke_test' });

    // 1. Search
    const suppliers = await client.searchSuppliers({ categoryId: 'test' });
    expect(suppliers.length).toBeGreaterThan(0);

    // 2. Create order
    const order = await client.createOrderFromGoal({ goal: 'Smoke test', category: 'test' });
    expect(order.orderId).toMatch(/^ord_smoke_/);
    expect(order.matchCount).toBeDefined();

    // 3. Select supplier → creates run + payout
    const { runId, payoutId, runStatus, payoutStatus } = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierId: suppliers[0].agentId,
    });
    expect(runId).toMatch(/^run_smoke_/);
    expect(payoutId).toMatch(/^pay_smoke_/);
    expect(runStatus).toBe('awaiting_start');
    expect(payoutStatus).toBe('held');

    // 4. Start run
    const run = await client.startRun({ runId });
    expect(run.status).toBe('in_progress');

    // 5. Deliver result
    await client.deliverResult({ runId, deliveryPayload: { answer: '42' } });

    // 6. Get run details
    const details = await client.getRunDetails({ runId });
    expect(details.status).toBe('delivered');

    // 7. Inspect deal state
    const deal = await client.inspectDealState({ orderId: order.orderId });
    expect(deal.runId).toBe(runId);

    // 8. Suggestion
    const suggestion = await client.suggestNextBestAction();
    expect(suggestion.action).toBeDefined();
  });

  it('should cancel an order', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}`, apiKey: 'ac_smoke_cancel' });
    await client.cancelOrder({ orderId: 'ord_smoke_1' });
  });

  it('should request review', async () => {
    const client = new SynapticRelayClient({ baseUrl: `http://localhost:${port}`, apiKey: 'ac_smoke_review' });
    await client.requestReview({ orderId: 'ord_smoke_1', reasonCode: 'quality', comment: 'Output was incomplete' });
  });
});
