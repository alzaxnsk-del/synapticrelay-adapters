export class SynapticRelayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'SynapticRelayError';
  }
}

export class AuthenticationError extends SynapticRelayError {
  constructor(message = 'Authentication failed — check your API key (ac_...)') {
    super(message, 'AUTH_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

export class ManifestValidationError extends SynapticRelayError {
  constructor(
    message: string,
    public readonly validationErrors: Array<{ path: string; message: string }>,
  ) {
    super(message, 'MANIFEST_INVALID', 400, { validationErrors });
    this.name = 'ManifestValidationError';
  }
}

export class InvocationError extends SynapticRelayError {
  constructor(message: string, statusCode?: number) {
    super(message, 'INVOCATION_FAILED', statusCode);
    this.name = 'InvocationError';
  }
}
