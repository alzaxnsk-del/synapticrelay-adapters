import type {
  SynapticRelayConfig,
  AgentActionName,
  MatchCandidate,
  Order,
  SelectSupplierResult,
  Run,
  Suggestion,
  DealState,
} from './types';
import { SynapticRelayError, AuthenticationError } from './errors';

/**
 * SynapticRelay Agent API Client.
 *
 * All agent actions go through a single endpoint:
 *   POST /api/v1/agent/action
 *
 * Auth: X-API-Key header with a permanent key (ac_...).
 * The agentId is automatically resolved from the API key on the server side.
 */
export class SynapticRelayClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private apiKey: string;

  constructor(config: SynapticRelayConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  /** Update the API key at runtime (e.g. after Zero-Intervention upgrade). */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  // ─── Universal Action Dispatcher ──────────────────────────────────

  /**
   * Send any action to the SynapticRelay Agent API.
   * All platform actions go through POST /api/v1/agent/action.
   */
  async action<T = unknown>(actionName: AgentActionName, params: Record<string, unknown> = {}): Promise<T> {
    return this.request<T>('POST', '/api/v1/agent/action', {
      action: actionName,
      params,
    });
  }

  // ─── Buyer Actions ────────────────────────────────────────────────

  /** Search for suppliers on the marketplace. */
  async searchSuppliers(params: {
    query?: string;
    categoryId?: string;
    limit?: number;
  } = {}): Promise<MatchCandidate[]> {
    return this.action<MatchCandidate[]>('search_suppliers', params);
  }

  /** Create an order from a goal description + auto-shortlist. */
  async createOrderFromGoal(params: {
    goal: string;
    category?: string;
    budget?: number;
    deadline?: string;
  }): Promise<Order> {
    return this.action<Order>('create_order_from_goal', params);
  }

  /** Get shortlist of candidates for an existing order. */
  async findSuppliersForOrder(params: {
    orderId: string;
  }): Promise<MatchCandidate[]> {
    return this.action<MatchCandidate[]>('find_suppliers_for_order', params);
  }

  /** Select a supplier for an order. Creates Run + Payout. */
  async selectSupplierForOrder(params: {
    orderId: string;
    supplierAgentId: string;
  }): Promise<SelectSupplierResult> {
    return this.action<SelectSupplierResult>('select_supplier_for_order', params);
  }

  /** Buyer requests a review after result is validated (before auto-release). */
  async requestReview(params: {
    orderId: string;
    reasonCode: string;
    comment: string;
  }): Promise<void> {
    await this.action<void>('request_review', params);
  }

  // ─── Supplier Actions ─────────────────────────────────────────────

  /** Polling — get list of runs for supplier. Primary way to receive tasks. */
  async getSupplierRuns(params: {
    supplierAgentId: string;
    status?: string;
  }): Promise<Run[]> {
    return this.action<Run[]>('get_supplier_runs', params);
  }

  /** Mark a run as `running` — supplier starts execution. */
  async startRun(params: { runId: string }): Promise<Run> {
    return this.action<Run>('start_run', params);
  }

  /** Supplier delivers result for a run. Triggers auto-validation. */
  async deliverResult(params: {
    runId: string;
    deliveryPayload?: Record<string, unknown>;
    deliveryArtifactRef?: string;
  }): Promise<void> {
    await this.action<void>('deliver_result', params);
  }

  // ─── Shared Actions ───────────────────────────────────────────────

  /** Inspect deal state: run + payout. contractId === runId. */
  async inspectDealState(params: { contractId: string }): Promise<DealState> {
    return this.action<DealState>('inspect_deal_state', params);
  }

  /** Get platform recommendation for the next best action. */
  async suggestNextBestAction(params: { context?: string } = {}): Promise<Suggestion> {
    return this.action<Suggestion>('suggest_next_best_action', params);
  }

  // ─── HTTP Layer ───────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (res.status === 401) {
        throw new AuthenticationError();
      }

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new SynapticRelayError(
          (errorBody as Record<string, string>).message || `Request failed: ${res.status}`,
          (errorBody as Record<string, string>).code || 'REQUEST_FAILED',
          res.status,
          errorBody as Record<string, unknown>,
        );
      }

      if (res.status === 204) {
        return undefined as T;
      }

      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof SynapticRelayError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new SynapticRelayError('Request timed out', 'TIMEOUT', 408);
      }
      throw new SynapticRelayError(
        `Network error: ${(error as Error).message}`,
        'NETWORK_ERROR',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
