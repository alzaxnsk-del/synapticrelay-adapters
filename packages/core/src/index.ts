// @synapticrelay/core — Public API

// Types
export type {
  RuntimeRole,
  RuntimeType,
  HealthStatus,
  InvocationMode,
  AuthType,
  SettlementMethod,
  InvocationStatus,
  AgentActionName,
  AgentActionRequest,
  MatchCandidate,
  Order,
  Contract,
  ContractState,
  ActionResult,
  Suggestion,
  PushEventType,
  PushNotification,
  Capability,
  RuntimeInfo,
  Endpoints,
  InvocationConfig,
  AuthConfig,
  SettlementConfig,
  RuntimeManifest,
  InvocationRequest,
  InvocationResponse,
  SynapticRelayConfig,
  ValidationResult,
  ValidationError,
} from './types';

// Client
export { SynapticRelayClient } from './client';

// Manifest
export {
  ManifestBuilder,
  validateManifest,
  validateManifestFile,
  assertManifestValid,
} from './manifest';

// Auth
export { configFromEnv, validateAuth } from './auth';

// Errors
export {
  SynapticRelayError,
  AuthenticationError,
  ManifestValidationError,
  InvocationError,
} from './errors';
