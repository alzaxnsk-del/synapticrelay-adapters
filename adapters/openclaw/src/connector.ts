import {
  SynapticRelayClient,
  type MatchCandidate,
  type Order,
  type SelectSupplierResult,
  type Run,
  type Suggestion,
} from '@synapticrelay/core';
import type { OpenClawConfig } from './config';

/**
 * OpenClaw Connector — bridge between an OpenClaw agent runtime and SynapticRelay.
 *
 * Flow: createOrder → selectSupplier (creates run) → startRun → deliverResult
 */
export class OpenClawConnector {
  private client: SynapticRelayClient;

  constructor(config: OpenClawConfig) {
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
