import type {
  SynapticRelayConfig,
  RegisterRuntimeRequest,
  RegisterRuntimeResponse,
  RuntimeDetails,
  RuntimeManifest,
  HealthReport,
  RuntimeAction,
  TrustState,
  HealthStatus,
  RuntimeRole,
} from './types';
import { SynapticRelayError, AuthenticationError } from './errors';

/**
 * HTTP client for the SynapticRelay Integration Surface API.
 *
 * Covers all endpoints under /api/v1/integration/* and relevant
 * marketplace endpoints under /api/v1/market/*.
 */
export class SynapticRelayClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private apiKey?: string;
  private jwtToken?: string;

  constructor(config: SynapticRelayConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.jwtToken = config.jwtToken;
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  // ─── Runtime Registration ───────────────────────────────────────

  async registerRuntime(data: RegisterRuntimeRequest): Promise<RegisterRuntimeResponse> {
    const res = await this.request<RegisterRuntimeResponse>(
      'POST',
      '/api/v1/integration/runtimes',
      data,
    );
    // Store the API key from registration
    if (res.apiKey) {
      this.apiKey = res.apiKey;
    }
    return res;
  }

  async getRuntime(runtimeId: string): Promise<RuntimeDetails> {
    return this.request<RuntimeDetails>('GET', `/api/v1/integration/runtimes/${runtimeId}`);
  }

  async listRuntimes(): Promise<RuntimeDetails[]> {
    return this.request<RuntimeDetails[]>('GET', '/api/v1/integration/runtimes');
  }

  async updateRuntime(
    runtimeId: string,
    data: Partial<Pick<RegisterRuntimeRequest, 'name' | 'description'>>,
  ): Promise<RuntimeDetails> {
    return this.request<RuntimeDetails>(
      'PATCH',
      `/api/v1/integration/runtimes/${runtimeId}`,
      data,
    );
  }

  async deleteRuntime(runtimeId: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/integration/runtimes/${runtimeId}`);
  }

  async changeRole(runtimeId: string, role: RuntimeRole): Promise<RuntimeDetails> {
    return this.request<RuntimeDetails>(
      'POST',
      `/api/v1/integration/runtimes/${runtimeId}/role`,
      { role },
    );
  }

  // ─── Manifest ───────────────────────────────────────────────────

  async submitManifest(runtimeId: string, manifest: RuntimeManifest): Promise<{ version: number }> {
    return this.request<{ version: number }>(
      'POST',
      `/api/v1/integration/runtimes/${runtimeId}/manifest`,
      manifest,
    );
  }

  async getManifest(runtimeId: string): Promise<RuntimeManifest & { version: number }> {
    return this.request<RuntimeManifest & { version: number }>(
      'GET',
      `/api/v1/integration/runtimes/${runtimeId}/manifest`,
    );
  }

  // ─── Health ─────────────────────────────────────────────────────

  async reportHealth(runtimeId: string, report: HealthReport): Promise<void> {
    await this.request<void>(
      'POST',
      `/api/v1/integration/runtimes/${runtimeId}/health`,
      report,
    );
  }

  async getHealth(runtimeId: string): Promise<{ healthStatus: HealthStatus; lastCheckAt?: string }> {
    return this.request('GET', `/api/v1/integration/runtimes/${runtimeId}/health`);
  }

  // ─── Actions & Trust ────────────────────────────────────────────

  async getActions(runtimeId: string): Promise<RuntimeAction[]> {
    return this.request<RuntimeAction[]>(
      'GET',
      `/api/v1/integration/runtimes/${runtimeId}/actions`,
    );
  }

  async getTrust(runtimeId: string): Promise<TrustState> {
    return this.request<TrustState>('GET', `/api/v1/integration/runtimes/${runtimeId}/trust`);
  }

  // ─── Marketplace Actions ────────────────────────────────────────

  async publishService(data: {
    title: string;
    description: string;
    category: string;
    price?: number;
    capabilities?: string[];
  }): Promise<{ serviceId: string }> {
    return this.request<{ serviceId: string }>('POST', '/api/v1/market/services', data);
  }

  async createOrder(data: {
    goal: string;
    category?: string;
    budget?: number;
    requirements?: Record<string, unknown>;
  }): Promise<{ orderId: string }> {
    return this.request<{ orderId: string }>('POST', '/api/v1/market/orders', data);
  }

  async getShortlist(orderId: string): Promise<Array<{ agentId: string; score: number; name: string }>> {
    return this.request('GET', `/api/v1/market/orders/${orderId}/shortlist`);
  }

  async selectSupplier(orderId: string, agentId: string): Promise<{ contractId: string }> {
    return this.request<{ contractId: string }>(
      'POST',
      `/api/v1/market/orders/${orderId}/shortlist`,
      { agentId },
    );
  }

  async openContract(data: {
    orderId: string;
    supplierId: string;
    terms?: Record<string, unknown>;
  }): Promise<{ contractId: string }> {
    return this.request<{ contractId: string }>('POST', '/api/v1/market/contracts', data);
  }

  async getContracts(runtimeId: string): Promise<Array<Record<string, unknown>>> {
    return this.request('GET', `/api/v1/integration/runtimes/${runtimeId}/contracts`);
  }

  async getReceipt(contractId: string): Promise<Record<string, unknown>> {
    return this.request('GET', `/api/v1/market/contracts/${contractId}/receipt`);
  }

  // ─── HTTP Layer ─────────────────────────────────────────────────

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }

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
