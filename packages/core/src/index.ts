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
  Capability,
  RuntimeInfo,
  Endpoints,
  InvocationConfig,
  AuthConfig,
  SettlementConfig,
  RuntimeManifest,
  RegisterRuntimeRequest,
  RegisterRuntimeResponse,
  RuntimeDetails,
  HealthReport,
  InvocationRequest,
  InvocationResponse,
  RuntimeAction,
  TrustState,
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
  RegistrationError,
  InvocationError,
} from './errors';
