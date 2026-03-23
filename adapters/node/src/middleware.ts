import type { InvocationRequest, InvocationResponse, HealthReport } from '@synapticrelay/core';

/**
 * Express middleware for SynapticRelay health endpoint.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { healthMiddleware } from '@synapticrelay/node-adapter';
 *
 * const app = express();
 * app.get('/health', healthMiddleware({ version: '1.0.0', capabilities: ['analyze'] }));
 * ```
 */
export function healthMiddleware(config: {
  version: string;
  capabilities?: string[];
  customData?: () => Record<string, unknown>;
}) {
  const startTime = Date.now();

  return (_req: unknown, res: { json: (data: unknown) => void }) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const custom = config.customData ? config.customData() : {};

    const health: HealthReport & { uptime: number } = {
      status: 'healthy',
      version: config.version,
      uptime: uptimeSeconds,
      capabilities: config.capabilities,
      ...custom,
    };

    (res as { json: (data: unknown) => void }).json(health);
  };
}

/**
 * Express middleware for SynapticRelay invoke endpoint.
 *
 * Routes invocations to capability handlers based on the `capability` field.
 *
 * @example
 * ```ts
 * app.post('/invoke', invokeMiddleware({
 *   handlers: {
 *     'analyze': async (input) => ({ result: 'analysis...' }),
 *     'summarize': async (input) => ({ summary: '...' }),
 *   },
 * }));
 * ```
 */
export function invokeMiddleware(config: {
  handlers: Record<string, (input: Record<string, unknown>) => Promise<Record<string, unknown>>>;
}) {
  return async (
    req: { body: InvocationRequest },
    res: { json: (data: unknown) => void; status: (code: number) => { json: (data: unknown) => void } },
  ) => {
    const { invocationId, capability, input } = req.body;

    if (!capability) {
      return res.status(400).json({
        invocationId: invocationId || 'unknown',
        status: 'failed',
        error: { code: 'MISSING_CAPABILITY', message: 'capability field is required' },
      } satisfies InvocationResponse);
    }

    const handler = config.handlers[capability];
    if (!handler) {
      return res.status(400).json({
        invocationId,
        status: 'failed',
        error: {
          code: 'UNKNOWN_CAPABILITY',
          message: `Unknown capability: ${capability}`,
        },
      } satisfies InvocationResponse);
    }

    try {
      const output = await handler(input || {});
      return res.json({
        invocationId,
        status: 'completed',
        output,
      } satisfies InvocationResponse);
    } catch (error) {
      return res.status(500).json({
        invocationId,
        status: 'failed',
        error: {
          code: 'EXECUTION_ERROR',
          message: (error as Error).message,
        },
      } satisfies InvocationResponse);
    }
  };
}
