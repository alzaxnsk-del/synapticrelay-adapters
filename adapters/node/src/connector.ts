import {
  SynapticRelayClient,
  type SynapticRelayConfig,
  type MatchCandidate,
  type Order,
  type SelectSupplierResult,
  type Run,
  type DealState,
  type Suggestion,
} from '@synapticrelay/core';

export interface NodeAdapterConfig {
  synapticRelayUrl: string;
  apiKey: string;
  agentBaseUrl: string;
}

export function configFromEnv(): NodeAdapterConfig {
  const synapticRelayUrl = process.env.SYNAPTICRELAY_URL;
  const apiKey = process.env.SYNAPTICRELAY_API_KEY;
  const agentBaseUrl = process.env.NODE_AGENT_URL;
  if (!synapticRelayUrl) throw new Error('SYNAPTICRELAY_URL is required');
  if (!apiKey) throw new Error('SYNAPTICRELAY_API_KEY is required');
  if (!agentBaseUrl) throw new Error('NODE_AGENT_URL is required');
  return { synapticRelayUrl, apiKey, agentBaseUrl: agentBaseUrl.replace(/\/+$/, '') };
}

/**
 * Node/TypeScript Agent Connector for SynapticRelay.
 *
 * Buyer flow:  createOrder → findSuppliers → selectSupplier → inspectDeal
 * Supplier flow:  getSupplierRuns (poll) → startRun → deliverResult
 */
export class SynapticRelayConnector {
  private client: SynapticRelayClient;

  constructor(config: NodeAdapterConfig) {
    this.client = new SynapticRelayClient({ baseUrl: config.synapticRelayUrl, apiKey: config.apiKey });
  }

  // ─── Buyer ─────────────────────────────────────────────────────
  async searchSuppliers(params: { query?: string; categoryId?: string; limit?: number } = {}) { return this.client.searchSuppliers(params); }
  async createOrderFromGoal(params: { goal: string; category?: string; budget?: number; deadline?: string }) { return this.client.createOrderFromGoal(params); }
  async findSuppliersForOrder(params: { orderId: string }) { return this.client.findSuppliersForOrder(params); }
  async selectSupplierForOrder(params: { orderId: string; supplierAgentId: string }) { return this.client.selectSupplierForOrder(params); }
  async requestReview(params: { orderId: string; reasonCode: string; comment: string }) { return this.client.requestReview(params); }

  // ─── Supplier ──────────────────────────────────────────────────
  async getSupplierRuns(params: { supplierAgentId: string; status?: string }) { return this.client.getSupplierRuns(params); }
  async startRun(params: { runId: string }) { return this.client.startRun(params); }
  async deliverResult(params: { runId: string; deliveryPayload?: Record<string, unknown>; deliveryArtifactRef?: string }) { return this.client.deliverResult(params); }

  // ─── Shared ────────────────────────────────────────────────────
  async inspectDealState(params: { contractId: string }) { return this.client.inspectDealState(params); }
  async suggestNextBestAction(params: { context?: string } = {}) { return this.client.suggestNextBestAction(params); }
  async action<T = unknown>(actionName: string, params: Record<string, unknown> = {}) { return this.client.action<T>(actionName as any, params); }
}
