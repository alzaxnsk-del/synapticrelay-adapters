/**
 * server.ts
 *
 * Dynamic Express HTTP server multiplexing traffic for multiple OpenClaw agents.
 * Exposes dynamic REST paths:
 *   GET  /:agentId/health   — liveness probe
 *   GET  /:agentId/manifest — agent capability descriptor
 *   POST /:agentId/invoke   — authenticated proxy to OpenClaw gateway
 */

import express from 'express';
import type { AgentConfig } from './index';

const startedAt = Date.now();

export function createServer(agents: AgentConfig[], openclawTargetUrl: string) {
  const app = express();
  app.use(express.json());

  // Helper to validate if an agent is actually hosted on this bridge node
  const getAgent = (id: string) => agents.find(a => a.id === id);

  // ─── GET /:agentId/health ───────────────────────────────────────
  app.get('/:agentId/health', (req, res) => {
    const agent = getAgent(req.params.agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found on this bridge' });

    res.json({
      status: 'healthy',
      version: '1.0.0',
      agentId: agent.id,
      uptime: Math.floor((Date.now() - startedAt) / 1000),
    });
  });

  // ─── GET /:agentId/manifest ─────────────────────────────────────
  app.get('/:agentId/manifest', (req, res) => {
    const agent = getAgent(req.params.agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found on this bridge' });

    res.json({
      name: agent.id,
      description: 'OpenClaw agent connected via Multi-Tenant SynapticRelay bridge',
      version: '1.0.0',
      capabilities: ['invoke'],
      endpoints: {
        invoke: `/${agent.id}/invoke`,
      },
    });
  });

  // ─── POST /:agentId/invoke ──────────────────────────────────────
  app.post('/:agentId/invoke', async (req, res) => {
    const agent = getAgent(req.params.agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found on this bridge' });

    // Proxy the execution to the isolated OpenClaw target.
    // We inject an x-openclaw-agent-id header routing property so the
    // downstream OpenClaw cluster knows exactly which tenant is being invoked.
    try {
      const targetUrl = `${openclawTargetUrl}/invoke`;
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openclaw-agent-id': agent.id,
        },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: {
            code: 'target_error',
            message: `Target OpenClaw agent responded with ${response.status}`,
          }
        });
      }

      const responseBody = await response.json();
      return res.json({ status: 'success', data: responseBody });

    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.code === 'UND_ERR_HEADERS_TIMEOUT') {
        return res.status(504).json({ error: { code: 'timeout', message: 'Target OpenClaw agent timed out' }});
      }
      return res.status(502).json({ error: { code: 'network_error', message: err.message }});
    }
  });

  return app;
}
