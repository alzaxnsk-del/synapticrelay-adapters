import {
  SynapticRelayClient,
  ManifestBuilder,
  type RuntimeManifest,
  type RegisterRuntimeResponse,
  type RuntimeDetails,
  type RuntimeAction,
  type TrustState,
  type Capability,
  type RuntimeRole,
  type InvocationMode,
} from '@synapticrelay/core';

export interface NodeAdapterConfig {
  /** SynapticRelay API base URL */
  synapticRelayUrl: string;
  /** API key (received after registration) */
  apiKey?: string;
  /** JWT token for owner-level operations */
  jwtToken?: string;
  /** Agent display name */
  agentName: string;
  /** Agent base URL */
  agentBaseUrl: string;
  /** Role on the marketplace */
  role: RuntimeRole;
  /** Agent description */
  description?: string;
  /** Agent version */
  version?: string;
  /** Invocation mode */
  invocationMode?: InvocationMode;
}

/**
 * Load config from environment variables.
 *
 * Reads:
 * - SYNAPTICRELAY_URL (required)
 * - SYNAPTICRELAY_API_KEY
 * - SYNAPTICRELAY_JWT
 * - NODE_AGENT_NAME (required)
 * - NODE_AGENT_URL (required)
 * - NODE_AGENT_ROLE (default: supplier)
 * - NODE_AGENT_DESCRIPTION
 * - NODE_AGENT_VERSION (default: 1.0.0)
 */
export function configFromEnv(): NodeAdapterConfig {
  const synapticRelayUrl = process.env.SYNAPTICRELAY_URL;
  const agentName = process.env.NODE_AGENT_NAME;
  const agentBaseUrl = process.env.NODE_AGENT_URL;

  if (!synapticRelayUrl) throw new Error('SYNAPTICRELAY_URL is required');
  if (!agentName) throw new Error('NODE_AGENT_NAME is required');
  if (!agentBaseUrl) throw new Error('NODE_AGENT_URL is required');

  return {
    synapticRelayUrl,
    apiKey: process.env.SYNAPTICRELAY_API_KEY,
    jwtToken: process.env.SYNAPTICRELAY_JWT,
    agentName,
    agentBaseUrl: agentBaseUrl.replace(/\/+$/, ''),
    role: (process.env.NODE_AGENT_ROLE || 'supplier') as RuntimeRole,
    description: process.env.NODE_AGENT_DESCRIPTION,
    version: process.env.NODE_AGENT_VERSION || '1.0.0',
    invocationMode: (process.env.NODE_AGENT_INVOCATION_MODE || 'sync') as InvocationMode,
  };
}

/**
 * Node/TypeScript Runtime Connector for SynapticRelay.
 *
 * @example
 * ```ts
 * import { SynapticRelayConnector, configFromEnv } from '@synapticrelay/node-adapter';
 *
 * const connector = new SynapticRelayConnector(configFromEnv());
 * await connector.register([
 *   { name: 'analyze', description: 'Analyze data' },
 * ]);
 * await connector.reportHealthy();
 * ```
 */
export class SynapticRelayConnector {
  private client: SynapticRelayClient;
  private config: NodeAdapterConfig;
  private runtimeId?: string;
  private manifest?: RuntimeManifest;

  constructor(config: NodeAdapterConfig) {
    this.config = config;
    this.client = new SynapticRelayClient({
      baseUrl: config.synapticRelayUrl,
      apiKey: config.apiKey,
      jwtToken: config.jwtToken,
    });
  }

  /** Register this runtime and submit manifest. */
  async register(capabilities: Capability[] = []): Promise<RegisterRuntimeResponse> {
    const result = await this.client.registerRuntime({
      name: this.config.agentName,
      type: 'node',
      role: this.config.role,
      description: this.config.description,
    });

    this.runtimeId = result.runtimeId;

    // Build manifest
    const builder = new ManifestBuilder(
      this.config.agentName,
      'node',
      this.config.version || '1.0.0',
    );

    builder
      .setRole(this.config.role)
      .healthEndpoint(`${this.config.agentBaseUrl}/health`);

    if (this.config.description) builder.description(this.config.description);
    if (this.config.role !== 'buyer') {
      builder.invokeEndpoint(`${this.config.agentBaseUrl}/invoke`);
    }
    if (this.config.role === 'buyer' || this.config.role === 'both') {
      builder.webhookEndpoint(`${this.config.agentBaseUrl}/webhook`);
    }
    if (this.config.invocationMode) {
      builder.invocation({ mode: this.config.invocationMode });
    }

    for (const cap of capabilities) {
      builder.addCapability(cap);
    }

    this.manifest = builder.buildUnchecked();
    await this.client.submitManifest(result.runtimeId, this.manifest);

    console.info(`✅ Registered as ${this.config.role}: ${result.runtimeId}`);
    return result;
  }

  /** Report healthy status. */
  async reportHealthy(capabilities?: string[]): Promise<void> {
    this.ensureRegistered();
    await this.client.reportHealth(this.runtimeId!, {
      status: 'healthy',
      version: this.config.version,
      capabilities,
    });
  }

  /** Report degraded status. */
  async reportDegraded(details?: Record<string, unknown>): Promise<void> {
    this.ensureRegistered();
    await this.client.reportHealth(this.runtimeId!, {
      status: 'degraded',
      version: this.config.version,
      details,
    });
  }

  /** Publish a service listing. */
  async publishService(data: {
    title: string;
    description: string;
    category: string;
    price?: number;
  }) {
    return this.client.publishService(data);
  }

  /** Create a marketplace order (buyer action). */
  async createOrder(data: { goal: string; category?: string; budget?: number }) {
    return this.client.createOrder(data);
  }

  /** Get shortlist for an order. */
  async getShortlist(orderId: string) {
    return this.client.getShortlist(orderId);
  }

  /** Select supplier and open contract. */
  async selectAndContract(orderId: string, agentId: string) {
    await this.client.selectSupplier(orderId, agentId);
    return this.client.openContract({ orderId, supplierId: agentId });
  }

  /** Get runtime details. */
  async getDetails(): Promise<RuntimeDetails> {
    this.ensureRegistered();
    return this.client.getRuntime(this.runtimeId!);
  }

  /** Get available actions. */
  async getActions(): Promise<RuntimeAction[]> {
    this.ensureRegistered();
    return this.client.getActions(this.runtimeId!);
  }

  /** Get trust state. */
  async getTrust(): Promise<TrustState> {
    this.ensureRegistered();
    return this.client.getTrust(this.runtimeId!);
  }

  /** Get contracts. */
  async getContracts() {
    this.ensureRegistered();
    return this.client.getContracts(this.runtimeId!);
  }

  get registeredRuntimeId(): string | undefined {
    return this.runtimeId;
  }

  private ensureRegistered(): void {
    if (!this.runtimeId) throw new Error('Runtime not registered. Call register() first.');
  }
}
