import {
  SynapticRelayClient,
  type RuntimeManifest,
  type RegisterRuntimeResponse,
  type RuntimeDetails,
  type HealthReport,
  type RuntimeAction,
  type TrustState,
} from '@synapticrelay/core';
import type { OpenClawConfig } from './config';
import { generateManifest, type OpenClawTool } from './manifest-mapper';

/**
 * OpenClaw Connector — bridge between an OpenClaw agent runtime and SynapticRelay.
 *
 * Handles registration, manifest submission, health reporting,
 * and marketplace actions (publish, order, shortlist, contract).
 *
 * @example
 * ```ts
 * import { OpenClawConnector, configFromEnv } from '@synapticrelay/openclaw-adapter';
 *
 * const connector = new OpenClawConnector(configFromEnv());
 *
 * // Register and go live
 * const { runtimeId, apiKey } = await connector.register([
 *   { name: 'summarize', description: 'Summarize text' },
 * ]);
 *
 * // Report health
 * await connector.reportHealthy();
 *
 * // Publish a service
 * await connector.publishService({
 *   title: 'Text Summarization',
 *   description: 'Summarize long documents',
 *   category: 'nlp',
 * });
 * ```
 */
export class OpenClawConnector {
  private client: SynapticRelayClient;
  private config: OpenClawConfig;
  private runtimeId?: string;
  private manifest?: RuntimeManifest;

  constructor(config: OpenClawConfig) {
    this.config = config;
    this.client = new SynapticRelayClient({
      baseUrl: config.synapticRelayUrl,
      apiKey: config.apiKey,
      jwtToken: config.jwtToken,
    });
  }

  // ─── Registration ─────────────────────────────────────────────

  /**
   * Register this OpenClaw agent with SynapticRelay.
   * Generates a manifest from the provided tools and submits it.
   *
   * @param tools — OpenClaw tool definitions to expose as capabilities
   * @returns Registration result with runtimeId and apiKey
   */
  async register(tools: OpenClawTool[] = []): Promise<RegisterRuntimeResponse> {
    // 1. Register the runtime
    const result = await this.client.registerRuntime({
      name: this.config.agentName,
      type: 'openclaw',
      role: this.config.role,
      description: this.config.description,
    });

    this.runtimeId = result.runtimeId;

    // 2. Generate and submit manifest
    this.manifest = generateManifest(this.config, tools);
    await this.client.submitManifest(result.runtimeId, this.manifest);

    console.info(`✅ Registered as ${this.config.role}: ${result.runtimeId}`);
    console.info(`🔑 API Key: ${result.apiKey.substring(0, 8)}...`);

    return result;
  }

  /**
   * Update the manifest with new tool definitions.
   */
  async updateManifest(tools: OpenClawTool[]): Promise<void> {
    this.ensureRegistered();
    this.manifest = generateManifest(this.config, tools);
    await this.client.submitManifest(this.runtimeId!, this.manifest);
    console.info('✅ Manifest updated');
  }

  // ─── Health ───────────────────────────────────────────────────

  /**
   * Report healthy status to SynapticRelay.
   */
  async reportHealthy(capabilities?: string[]): Promise<void> {
    this.ensureRegistered();
    await this.client.reportHealth(this.runtimeId!, {
      status: 'healthy',
      version: this.config.version,
      capabilities,
    });
  }

  /**
   * Report degraded status to SynapticRelay.
   */
  async reportDegraded(details?: Record<string, unknown>): Promise<void> {
    this.ensureRegistered();
    await this.client.reportHealth(this.runtimeId!, {
      status: 'degraded',
      version: this.config.version,
      details,
    });
  }

  // ─── Supplier Actions ─────────────────────────────────────────

  /**
   * Publish a service listing on the marketplace.
   */
  async publishService(data: {
    title: string;
    description: string;
    category: string;
    price?: number;
  }): Promise<{ serviceId: string }> {
    return this.client.publishService(data);
  }

  /**
   * Get contracts involving this runtime's agent.
   */
  async getContracts(): Promise<Array<Record<string, unknown>>> {
    this.ensureRegistered();
    return this.client.getContracts(this.runtimeId!);
  }

  // ─── Buyer Actions ────────────────────────────────────────────

  /**
   * Create an order on the marketplace (buyer action).
   */
  async createOrder(data: {
    goal: string;
    category?: string;
    budget?: number;
    requirements?: Record<string, unknown>;
  }): Promise<{ orderId: string }> {
    return this.client.createOrder(data);
  }

  /**
   * Get the shortlist for an order.
   */
  async getShortlist(orderId: string) {
    return this.client.getShortlist(orderId);
  }

  /**
   * Select a supplier from the shortlist.
   */
  async selectSupplier(orderId: string, agentId: string) {
    return this.client.selectSupplier(orderId, agentId);
  }

  /**
   * Open a contract with a selected supplier.
   */
  async openContract(data: {
    orderId: string;
    supplierId: string;
    terms?: Record<string, unknown>;
  }) {
    return this.client.openContract(data);
  }

  // ─── Inspection ───────────────────────────────────────────────

  /**
   * Get runtime details from SynapticRelay.
   */
  async getDetails(): Promise<RuntimeDetails> {
    this.ensureRegistered();
    return this.client.getRuntime(this.runtimeId!);
  }

  /**
   * Get available actions for this runtime (role-aware).
   */
  async getActions(): Promise<RuntimeAction[]> {
    this.ensureRegistered();
    return this.client.getActions(this.runtimeId!);
  }

  /**
   * Get trust/verification state for this runtime.
   */
  async getTrust(): Promise<TrustState> {
    this.ensureRegistered();
    return this.client.getTrust(this.runtimeId!);
  }

  /**
   * Get a contract receipt.
   */
  async getReceipt(contractId: string) {
    return this.client.getReceipt(contractId);
  }

  // ─── Helpers ──────────────────────────────────────────────────

  get registeredRuntimeId(): string | undefined {
    return this.runtimeId;
  }

  get currentManifest(): RuntimeManifest | undefined {
    return this.manifest;
  }

  private ensureRegistered(): void {
    if (!this.runtimeId) {
      throw new Error(
        'Runtime not registered. You must call `await connector.register()` first.\n' +
        'If you already registered previously, you must initialize the connector with the saved runtimeId.'
      );
    }
  }
}
