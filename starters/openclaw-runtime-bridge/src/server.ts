import express from 'express';
import { loadConfig } from './config';
import { invokeTargetAgent, checkTargetHealth, type InvokePayload } from './openclaw-client';

const config = loadConfig();
const app = express();

app.use(express.json());

// ==========================================
// SynapticRelay REQUIRED ENDPOINTS
// ==========================================

/**
 * GET /health
 * SynapticRelay calls this to verify the runtime is alive and ready for marketplace traffic.
 */
app.get('/health', async (req, res) => {
  // 1. Check if the bridge itself is alive (Yes, since we're responding)
  // 2. Check if the downstream target OpenClaw agent is reachable
  const targetReachable = await checkTargetHealth(config.targetOpenClawUrl, config.targetTimeoutMs);

  if (targetReachable) {
    res.json({
      status: 'healthy',
      agent: config.agentName,
      target: 'reachable',
    });
  } else {
    // If the target is unreachable, the bridge is "degraded"
    res.status(503).json({
      status: 'degraded',
      agent: config.agentName,
      error: `Configured target OpenClaw agent at ${config.targetOpenClawUrl} is unreachable.`,
    });
  }
});

/**
 * POST /invoke
 * SynapticRelay calls this when a buyer executes a contract.
 * We normalize the payload and proxy it to the protected internal OpenClaw agent.
 */
app.post('/invoke', async (req, res) => {
  const payload = req.body as InvokePayload;

  if (!payload || !payload.capability) {
    return res.status(400).json({
      error: { code: 'bad_request', message: 'Missing "capability" in payload' },
    });
  }

  // Proxy the execution to the isolated OpenClaw target
  const response = await invokeTargetAgent(config.targetOpenClawUrl, config.targetTimeoutMs, payload);

  if (response.error) {
    // Determine appropriate HTTP status
    let status = 500;
    if (response.error.code === 'timeout') status = 504;
    if (response.error.code === 'target_not_found') status = 502;
    if (response.error.code === 'network_error') status = 502;

    return res.status(status).json({
      error: response.error,
    });
  }

  return res.json({
    status: 'success',
    data: response.result,
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

export function startServer() {
  app.listen(config.port, () => {
    console.log(`\n🔌 OpenClaw Runtime Bridge started on port ${config.port}`);
    console.log(`📡 Agent Name: ${config.agentName}`);
    console.log(`🌐 Public URL: ${config.agentBaseUrl}`);
    console.log(`🎯 Target URL: ${config.targetOpenClawUrl}`);
    console.log(`\nNext step: Run 'npm run register' to publish to SynapticRelay!`);
  });
}
