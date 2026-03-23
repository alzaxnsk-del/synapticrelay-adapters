import {
  SynapticRelayClient,
  type SynapticRelayConfig,
  type MatchCandidate,
  type Order,
  type SelectSupplierResult,
  type Run,
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
 * Flow: createOrder → selectSupplier (creates run) → startRun → deliverResult
 *
 * @example
 * ```ts
 * const connector = new SynapticRelayConnector(configFromEnv());
 * const order = await connector.createOrderFromGoal({ goal: 'Analyze data' });
 * const { runId } = await connector.selectSupplierForOrder({ orderId: order.orderId, supplierId: 'sup_1' });
 * await connector.startRun({ runId });
 * await connector.deliverResult({ runId, deliveryPayload: { result: 'done' } });
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

  async searchSuppliers(params: { categoryId?: string; maxPrice?: number; limit?: number } = {}) {
    return this.client.searchSuppliers(params);
  }

  async createOrderFromGoal(params: { goal: string; category?: string; budget?: number }) {
    return this.client.createOrderFromGoal(params);
  }

  async selectSupplierForOrder(params: { orderId: string; supplierId: string }) {
    return this.client.selectSupplierForOrder(params);
  }

  async cancelOrder(params: { orderId: string }) {
    return this.client.cancelOrder(params);
  }

  async requestReview(params: { orderId: string; reasonCode: string; comment: string }) {
    return this.client.requestReview(params);
  }

  // ─── Supplier Actions ──────────────────────────────────────────

  async startRun(params: { runId: string }) {
    return this.client.startRun(params);
  }

  async deliverResult(params: { runId: string; deliveryPayload?: Record<string, unknown>; deliveryArtifactRef?: string }) {
    return this.client.deliverResult(params);
  }

  // ─── Common Actions ────────────────────────────────────────────

  async getRunDetails(params: { runId: string }) {
    return this.client.getRunDetails(params);
  }

  async suggestNextBestAction() {
    return this.client.suggestNextBestAction();
  }

  async inspectDealState(params: { orderId: string }) {
    return this.client.inspectDealState(params);
  }

  async action<T = unknown>(actionName: string, params: Record<string, unknown> = {}) {
    return this.client.action<T>(actionName as any, params);
  }
}
