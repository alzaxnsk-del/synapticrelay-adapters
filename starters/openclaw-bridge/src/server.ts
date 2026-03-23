/**
 * server.ts
 *
 * Express HTTP server exposing the endpoints SynapticRelay expects
 * during the onboarding inspection phase:
 *   GET  /health   — liveness probe
 *   GET  /manifest — agent capability descriptor
 *   POST /invoke   — proxy to the real OpenClaw agent (stub for now)
 */

import express from 'express';

const startedAt = Date.now();

export function createServer(agentId: string) {
  const app = express();
  app.use(express.json());

  // ─── GET /health ────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
    });
  });

  // ─── GET /manifest ──────────────────────────────────────────────
  app.get('/manifest', (_req, res) => {
    res.json({
      name: agentId,
      description: 'OpenClaw agent connected via SynapticRelay bridge',
      version: '1.0.0',
      capabilities: ['invoke'],
      endpoints: {
        invoke: '/invoke',
      },
    });
  });

  // ─── POST /invoke ───────────────────────────────────────────────
  // Stub — returns 501 until you wire it to your real OpenClaw agent.
  app.post('/invoke', (_req, res) => {
    res.status(501).json({
      error: {
        code: 'not_implemented',
        message:
          'Invoke proxy is not configured yet. ' +
          'Wire this endpoint to your OpenClaw agent to handle real requests.',
      },
    });
  });

  return app;
}
