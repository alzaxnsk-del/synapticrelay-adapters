// ─── Enums & Literals ───────────────────────────────────────────────

export type RuntimeRole = 'supplier' | 'buyer' | 'both';
export type RuntimeType = 'openclaw' | 'python' | 'node' | 'mcp' | 'http' | 'custom';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline' | 'unknown';
export type InvocationMode = 'sync' | 'async' | 'webhook';
export type AuthType = 'api_key' | 'bearer' | 'none';
export type SettlementMethod = 'escrow' | 'direct' | 'milestone';
export type InvocationStatus = 'processing' | 'completed' | 'failed';

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
  specVersion: '1.0';
  runtime: RuntimeInfo;
  role: RuntimeRole;
  capabilities?: Capability[];
  endpoints: Endpoints;
  invocation?: InvocationConfig;
  auth?: AuthConfig;
  settlement?: SettlementConfig;
  metadata?: Record<string, unknown>;
}

// ─── API Types ──────────────────────────────────────────────────────

export interface RegisterRuntimeRequest {
  name: string;
  type: RuntimeType;
  role: RuntimeRole;
  description?: string;
}

export interface RegisterRuntimeResponse {
  runtimeId: string;
  apiKey: string;
  createdAt: string;
}

export interface RuntimeDetails {
  id: string;
  name: string;
  type: RuntimeType;
  role: RuntimeRole;
  status: string;
  healthStatus: HealthStatus;
  healthEndpoint?: string;
  invokeEndpoint?: string;
  lastHealthCheckAt?: string;
  currentManifestVersion?: number;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthReport {
  status: HealthStatus;
  version?: string;
  uptime?: number;
  capabilities?: string[];
  details?: Record<string, unknown>;
}

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

export interface RuntimeAction {
  name: string;
  description: string;
  method: string;
  path: string;
  available: boolean;
  reason?: string;
}

export interface TrustState {
  verified: boolean;
  reputationScore?: number;
  totalContracts?: number;
  completedContracts?: number;
  disputes?: number;
}

// ─── Config ─────────────────────────────────────────────────────────

export interface SynapticRelayConfig {
  /** Base URL of the SynapticRelay API (e.g., https://api.synapticrelay.io) */
  baseUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** JWT token for owner-level operations */
  jwtToken?: string;
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
