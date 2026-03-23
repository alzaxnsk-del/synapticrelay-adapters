/**
 * Integration Smoke Test
 *
 * Starts a minimal mock server and runs action flows against it,
 * proving the end-to-end Agent Action API path works.
 */

import { SynapticRelayClient } from '../packages/core/src';

import * as http from 'http';

function createMockServer(): http.Server {
  let orderCounter = 0;
  let contractCounter = 0;

  return http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');

      const url = req.url || '';
      const method = req.method || 'GET';

      // POST /api/v1/agent/action — unified action endpoint
      if (method === 'POST' && url === '/api/v1/agent/action') {
        const parsed = body ? JSON.parse(body) : {};
        const action = parsed.action;
        const params = parsed.params || {};

        switch (action) {
          case 'search_suppliers':
            res.end(JSON.stringify([
              { agentId: 'sup-1', name: 'Test Supplier', score: 0.95, price: 0.05 },
            ]));
            return;

          case 'create_order_from_goal':
            orderCounter++;
            res.end(JSON.stringify({
              orderId: `ord_smoke_${orderCounter}`,
              title: `Order: ${params.goal}`,
              status: 'open',
            }));
            return;

          case 'select_supplier_for_order':
            contractCounter++;
            res.end(JSON.stringify({
              contractId: `ctr_smoke_${contractCounter}`,
              orderId: params.orderId,
              supplierId: params.supplierId,
              status: 'executing',
            }));
            return;

          case 'submit_result':
            res.statusCode = 200;
            res.end(JSON.stringify({ received: true }));
            return;

          case 'get_result':
            res.end(JSON.stringify({
              resultId: 'res_smoke_1',
              contractId: params.contractId,
              data: { summary: 'test' },
              submittedAt: new Date().toISOString(),
            }));
            return;

          case 'suggest_next_best_action':
            res.end(JSON.stringify({
              action: 'search_suppliers',
              reason: 'Start by discovering suppliers',
            }));
            return;

          case 'inspect_contract_state':
            res.end(JSON.stringify({
              contractId: params.contractId,
              status: 'executing',
              supplierId: 'sup-1',
              buyerId: 'buyer-smoke',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
            return;

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

  it('should complete full buyer flow via Agent Action API', async () => {
    const client = new SynapticRelayClient({
      baseUrl: `http://localhost:${port}`,
      apiKey: 'ac_smoke_test',
    });

    // 1. Search suppliers
    const suppliers = await client.searchSuppliers({ categoryId: 'test' });
    expect(suppliers.length).toBeGreaterThan(0);
    expect(suppliers[0].agentId).toBe('sup-1');

    // 2. Create order from goal
    const order = await client.createOrderFromGoal({ goal: 'Smoke test task', category: 'test' });
    expect(order.orderId).toMatch(/^ord_smoke_/);

    // 3. Select supplier
    const contract = await client.selectSupplierForOrder({
      orderId: order.orderId,
      supplierId: suppliers[0].agentId,
    });
    expect(contract.contractId).toMatch(/^ctr_smoke_/);

    // 4. Inspect contract
    const state = await client.inspectContractState({ contractId: contract.contractId });
    expect(state.status).toBe('executing');

    // 5. Get suggestion
    const suggestion = await client.suggestNextBestAction();
    expect(suggestion.action).toBeDefined();
  });

  it('should complete supplier result submission', async () => {
    const client = new SynapticRelayClient({
      baseUrl: `http://localhost:${port}`,
      apiKey: 'ac_smoke_supplier',
    });

    // Submit result
    await client.submitResult({
      contractId: 'ctr_smoke_1',
      result: { answer: '42' },
    });

    // Get result
    const result = await client.getResult({ contractId: 'ctr_smoke_1' });
    expect(result.contractId).toBe('ctr_smoke_1');
    expect(result.data).toHaveProperty('summary');
  });
});
