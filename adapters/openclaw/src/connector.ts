import {
  SynapticRelayClient,
  type MatchCandidate,
  type Order,
  type SelectSupplierResult,
  type Run,
  type DealState,
  type Suggestion,
} from '@synapticrelay/core';
import type { OpenClawConfig } from './config';

/**
 * OpenClaw Connector for SynapticRelay.
 *
 * Buyer flow:  createOrder → findSuppliers → selectSupplier → inspectDeal
 * Supplier flow:  getSupplierRuns (poll) → startRun → deliverResult
 */
export class OpenClawConnector {
  private client: SynapticRelayClient;

  constructor(config: OpenClawConfig) {
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
