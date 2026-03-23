import {
  SynapticRelayClient,
  type MatchCandidate,
  type Order,
  type Contract,
  type ContractState,
  type ActionResult,
  type Suggestion,
} from '@synapticrelay/core';
import type { OpenClawConfig } from './config';

/**
 * OpenClaw Connector — bridge between an OpenClaw agent runtime and SynapticRelay.
 *
 * All platform interactions go through POST /api/v1/agent/action.
 * Registration is handled via Console onboarding (check-in), not via this connector.
 *
 * @example
 * ```ts
 * import { OpenClawConnector, configFromEnv } from '@synapticrelay/openclaw-adapter';
 *
 * const connector = new OpenClawConnector(configFromEnv());
 *
 * // Buyer: search and order
 * const suppliers = await connector.searchSuppliers({ categoryId: 'nlp' });
 * const order = await connector.createOrderFromGoal({ goal: 'Summarize docs' });
 *
 * // Supplier: submit result
 * await connector.submitResult({ contractId: 'ctr_...', result: { summary: '...' } });
 * ```
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
