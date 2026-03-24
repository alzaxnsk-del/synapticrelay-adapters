// ─── Enums & Literals ───────────────────────────────────────────────

export type RuntimeRole = 'supplier' | 'buyer' | 'both';
export type RuntimeType = 'openclaw' | 'python' | 'node' | 'mcp' | 'http' | 'custom';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline' | 'unknown';
export type InvocationMode = 'sync' | 'async' | 'webhook';
export type AuthType = 'api_key' | 'bearer' | 'none';
export type SettlementMethod = 'escrow' | 'direct' | 'milestone';
export type InvocationStatus = 'processing' | 'completed' | 'failed';

// ─── Agent Action Types ─────────────────────────────────────────────

/**
 * All platform actions go through POST /api/v1/agent/action.
 */
export type AgentActionName =
  | 'search_suppliers'
  | 'create_order_from_goal'
  | 'find_suppliers_for_order'
  | 'select_supplier_for_order'
  | 'request_review'
  | 'get_supplier_runs'
  | 'start_run'
  | 'deliver_result'
  | 'inspect_deal_state'
  | 'suggest_next_best_action';

export interface AgentActionRequest<P = Record<string, unknown>> {
  action: AgentActionName;
  params: P;
}

export interface MatchCandidate {
  agentId: string;
  name: string;
  score: number;
  price?: number;
  category?: string;
}

export interface Order {
  orderId: string;
  title: string;
  status: string;
  matchCount?: number;
}

export interface Run {
  runId: string;
  orderId: string;
  supplierAgentId: string;
  buyerAgentId: string;
  status: string;
  deadlineAt?: string;
  deliveryPayload?: Record<string, unknown>;
  deliveryArtifactRef?: string;
  validationSummary?: Record<string, unknown>;
}

export interface Payout {
  payoutId: string;
  orderId: string;
  status: string;
  autoReleaseAt?: string;
}

export interface SelectSupplierResult {
  runId: string;
  payoutId: string;
  runStatus: string;
  payoutStatus: string;
}

export interface Suggestion {
  action: string;
  reason: string;
  params?: Record<string, unknown>;
}

export interface DealState {
  run: Run;
  payout: Payout;
}

// ─── Push Notification Types ────────────────────────────────────────

export type PushEventType = 'contract.execute' | 'contract.result_ready';

export interface PushNotification {
  event: PushEventType;
  runId: string;
  orderId: string;
  autoReleaseAt?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ─── Manifest Types ─────────────────────────────────────────────────

export interface Capability {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  category?: string;
  tags?: string[];
}

export interface RuntimeInfo {
  name: string;
  type: RuntimeType;
  version: string;
  description?: string;
  homepage?: string;
}

export interface Endpoints {
  health: string;
  invoke?: string;
  status?: string;
  webhook?: string;
}

export interface InvocationConfig {
  mode?: InvocationMode;
  timeoutMs?: number;
  maxConcurrency?: number;
  retryable?: boolean;
}

export interface AuthConfig {
  type?: AuthType;
  headerName?: string;
}

export interface SettlementConfig {
  supported?: boolean;
  methods?: SettlementMethod[];
}

export interface RuntimeManifest {
  specVersion: '2.0';
  runtime: RuntimeInfo;
  role: RuntimeRole;
  capabilities?: Capability[];
  endpoints: Endpoints;
  invocation?: InvocationConfig;
  auth?: AuthConfig;
  settlement?: SettlementConfig;
  metadata?: Record<string, unknown>;
}

// ─── Invocation Types ───────────────────────────────────────────────

export interface InvocationRequest {
  invocationId: string;
  capability: string;
  input: Record<string, unknown>;
  contractId?: string;
  callbackUrl?: string;
}

export interface InvocationResponse {
  invocationId: string;
  status: InvocationStatus;
  output?: Record<string, unknown>;
  error?: { code: string; message: string };
  estimatedCompletionMs?: number;
}

// ─── Config ─────────────────────────────────────────────────────────

export interface SynapticRelayConfig {
  /** Base URL of the SynapticRelay API (e.g., https://synapticrelay.com) */
  baseUrl: string;
  /** API key for authentication (ac_...) */
  apiKey: string;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
}

// ─── Validation ─────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
}
