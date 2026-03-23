import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type {
  RuntimeManifest,
  Capability,
  RuntimeRole,
  RuntimeType,
  InvocationMode,
  AuthType,
  SettlementMethod,
  ValidationResult,
} from './types';
import { ManifestValidationError } from './errors';
import * as fs from 'fs';
import * as path from 'path';

// ─── Manifest Validator ─────────────────────────────────────────────

let cachedSchema: Record<string, unknown> | null = null;

function loadSchema(): Record<string, unknown> {
  if (cachedSchema) return cachedSchema;

  // Try multiple paths to find the schema
  const possiblePaths = [
    path.resolve(__dirname, '../../../spec/manifest.schema.json'),
    path.resolve(__dirname, '../../spec/manifest.schema.json'),
    path.resolve(process.cwd(), 'spec/manifest.schema.json'),
  ];

  for (const schemaPath of possiblePaths) {
    try {
      const raw = fs.readFileSync(schemaPath, 'utf-8');
      cachedSchema = JSON.parse(raw);
      return cachedSchema!;
    } catch {
      // Try next path
    }
  }

  throw new Error(
    'Could not find manifest.schema.json. Make sure you are running from the repo root or specify the schema path.',
  );
}

/**
 * Validate a manifest against the canonical JSON Schema.
 *
 * @returns ValidationResult with errors if invalid
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const schema = loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });

  // Add format validation support
  try {
    addFormats(ajv);
  } catch {
    // ajv-formats may not be installed; URI format checking is optional
  }

  const validate = ajv.compile(schema);
  const valid = validate(manifest);

  if (valid) {
    // Additional semantic validation
    const semanticErrors = validateSemantics(manifest as RuntimeManifest);
    if (semanticErrors.length > 0) {
      return { valid: false, errors: semanticErrors };
    }
    return { valid: true, errors: [] };
  }

  const errors = (validate.errors || []).map((err) => ({
    path: err.instancePath || '/',
    message: err.message || 'Unknown validation error',
    keyword: err.keyword,
  }));

  return { valid: false, errors };
}

/**
 * Validate a manifest and throw if invalid.
 */
export function assertManifestValid(manifest: unknown): asserts manifest is RuntimeManifest {
  const result = validateManifest(manifest);
  if (!result.valid) {
    throw new ManifestValidationError(
      `Manifest validation failed with ${result.errors.length} error(s)`,
      result.errors,
    );
  }
}

/**
 * Validate manifest from a JSON file path.
 */
export function validateManifestFile(filePath: string): ValidationResult {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let manifest: unknown;
  try {
    manifest = JSON.parse(raw);
  } catch {
    return {
      valid: false,
      errors: [{ path: '/', message: `Invalid JSON: ${filePath}` }],
    };
  }
  return validateManifest(manifest);
}

// ─── Semantic Validation ────────────────────────────────────────────

function validateSemantics(manifest: RuntimeManifest): Array<{ path: string; message: string }> {
  const errors: Array<{ path: string; message: string }> = [];

  // Suppliers and both-role must have capabilities
  if ((manifest.role === 'supplier' || manifest.role === 'both') &&
      (!manifest.capabilities || manifest.capabilities.length === 0)) {
    errors.push({
      path: '/capabilities',
      message: 'Capabilities are required when role is "supplier" or "both"',
    });
  }

  // Suppliers and both-role must have invoke endpoint
  if ((manifest.role === 'supplier' || manifest.role === 'both') && !manifest.endpoints.invoke) {
    errors.push({
      path: '/endpoints/invoke',
      message: 'Invoke endpoint is required when role is "supplier" or "both"',
    });
  }

  // Capability names must be unique
  if (manifest.capabilities) {
    const names = new Set<string>();
    for (const cap of manifest.capabilities) {
      if (names.has(cap.name)) {
        errors.push({
          path: `/capabilities/${cap.name}`,
          message: `Duplicate capability name: "${cap.name}"`,
        });
      }
      names.add(cap.name);
    }
  }

  return errors;
}

// ─── Manifest Builder ───────────────────────────────────────────────

/**
 * Fluent builder for creating valid RuntimeManifest objects.
 *
 * @example
 * ```ts
 * const manifest = new ManifestBuilder('My Agent', 'python', '1.0.0')
 *   .role('supplier')
 *   .healthEndpoint('http://localhost:8000/health')
 *   .invokeEndpoint('http://localhost:8000/invoke')
 *   .addCapability({
 *     name: 'summarize',
 *     description: 'Summarize text documents',
 *   })
 *   .build();
 * ```
 */
export class ManifestBuilder {
  private manifest: RuntimeManifest;

  constructor(name: string, type: RuntimeType, version: string) {
    this.manifest = {
      specVersion: '1.0',
      runtime: { name, type, version },
      role: 'supplier',
      endpoints: { health: '' },
    };
  }

  /** Set the runtime role (supplier, buyer, both) */
  setRole(role: RuntimeRole): this {
    this.manifest.role = role;
    return this;
  }

  /** Set runtime description */
  description(desc: string): this {
    this.manifest.runtime.description = desc;
    return this;
  }

  /** Set runtime homepage URL */
  homepage(url: string): this {
    this.manifest.runtime.homepage = url;
    return this;
  }

  /** Set health endpoint URL */
  healthEndpoint(url: string): this {
    this.manifest.endpoints.health = url;
    return this;
  }

  /** Set invoke endpoint URL */
  invokeEndpoint(url: string): this {
    this.manifest.endpoints.invoke = url;
    return this;
  }

  /** Set status polling endpoint URL */
  statusEndpoint(url: string): this {
    this.manifest.endpoints.status = url;
    return this;
  }

  /** Set webhook callback endpoint URL */
  webhookEndpoint(url: string): this {
    this.manifest.endpoints.webhook = url;
    return this;
  }

  /** Add a capability */
  addCapability(cap: Capability): this {
    if (!this.manifest.capabilities) {
      this.manifest.capabilities = [];
    }
    this.manifest.capabilities.push(cap);
    return this;
  }

  /** Set invocation configuration */
  invocation(config: {
    mode?: InvocationMode;
    timeoutMs?: number;
    maxConcurrency?: number;
    retryable?: boolean;
  }): this {
    this.manifest.invocation = config;
    return this;
  }

  /** Set auth configuration */
  auth(config: { type?: AuthType; headerName?: string }): this {
    this.manifest.auth = config;
    return this;
  }

  /** Set settlement configuration */
  settlement(config: { supported?: boolean; methods?: SettlementMethod[] }): this {
    this.manifest.settlement = config;
    return this;
  }

  /** Set arbitrary metadata */
  meta(data: Record<string, unknown>): this {
    this.manifest.metadata = { ...this.manifest.metadata, ...data };
    return this;
  }

  /** Build and validate the manifest */
  build(): RuntimeManifest {
    assertManifestValid(this.manifest);
    return { ...this.manifest };
  }

  /** Build without validation (useful during development) */
  buildUnchecked(): RuntimeManifest {
    return { ...this.manifest };
  }
}
