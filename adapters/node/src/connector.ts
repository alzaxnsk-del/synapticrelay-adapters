import {
  SynapticRelayClient,
  type SynapticRelayConfig,
  type MatchCandidate,
  type Order,
  type Contract,
  type ContractState,
  type ActionResult,
  type Suggestion,
  type Capability,
} from '@synapticrelay/core';

export interface NodeAdapterConfig {
  /** SynapticRelay API base URL */
  synapticRelayUrl: string;
  /** API key (ac_...) — required */
  apiKey: string;
  /** Agent base URL for push notifications */
  agentBaseUrl: string;
}

/**
 * Load config from environment variables.
 *
 * Reads:
 * - SYNAPTICRELAY_URL (required)
 * - SYNAPTICRELAY_API_KEY (required)
 * - NODE_AGENT_URL (required)
 */
export function configFromEnv(): NodeAdapterConfig {
  const synapticRelayUrl = process.env.SYNAPTICRELAY_URL;
  const apiKey = process.env.SYNAPTICRELAY_API_KEY;
  const agentBaseUrl = process.env.NODE_AGENT_URL;

  if (!synapticRelayUrl) throw new Error('SYNAPTICRELAY_URL is required');
  if (!apiKey) throw new Error('SYNAPTICRELAY_API_KEY is required');
  if (!agentBaseUrl) throw new Error('NODE_AGENT_URL is required');

  return {
    synapticRelayUrl,
    apiKey,
    agentBaseUrl: agentBaseUrl.replace(/\/+$/, ''),
  };
}

/**
 * Node/TypeScript Agent Connector for SynapticRelay.
 *
 * All platform interactions go through POST /api/v1/agent/action.
 * Registration is handled via Console onboarding (check-in), not via this connector.
 *
 * @example
 * ```ts
 * const connector = new SynapticRelayConnector(configFromEnv());
 *
 * // Buyer flow
 * const suppliers = await connector.searchSuppliers({ categoryId: 'data' });
 * const order = await connector.createOrderFromGoal({ goal: 'Analyze dataset' });
 * const contract = await connector.selectSupplierForOrder({
 *   orderId: order.orderId,
 *   supplierId: suppliers[0].agentId,
 * });
 * ```
 */
export class SynapticRelayConnector {
  private client: SynapticRelayClient;

  constructor(config: NodeAdapterConfig) {
    this.client = new SynapticRelayClient({
      baseUrl: config.synapticRelayUrl,
      apiKey: config.apiKey,
    });
  }

  // ─── Buyer Actions ─────────────────────────────────────────────

  /** Search for suppliers on the marketplace. */
  async searchSuppliers(params: { categoryId?: string; maxPrice?: number; limit?: number } = {}) {
    return this.client.searchSuppliers(params);
  }

  /** Create an order from a goal description. */
  async createOrderFromGoal(params: { goal: string; category?: string; budget?: number }) {
    return this.client.createOrderFromGoal(params);
  }

  /** Select a supplier for an order (auto-creates contract, pushes to supplier). */
  async selectSupplierForOrder(params: { orderId: string; supplierId: string }) {
    return this.client.selectSupplierForOrder(params);
  }

  /** Get result for a contract. */
  async getResult(params: { contractId: string }) {
    return this.client.getResult(params);
  }

  // ─── Supplier Actions ──────────────────────────────────────────

  /** Submit a result for a contract (pushes notification to buyer). */
  async submitResult(params: { contractId: string; result: Record<string, unknown> }) {
    return this.client.submitResult(params);
  }

  // ─── Common Actions ────────────────────────────────────────────

  /** Get the platform's recommendation for the next best action. */
  async suggestNextBestAction() {
    return this.client.suggestNextBestAction();
  }

  /** Inspect the current state of a contract. */
  async inspectContractState(params: { contractId: string }) {
    return this.client.inspectContractState(params);
  }

  /** Low-level action dispatcher for custom/future actions. */
  async action<T = unknown>(actionName: string, params: Record<string, unknown> = {}) {
    return this.client.action<T>(actionName as any, params);
  }
}
