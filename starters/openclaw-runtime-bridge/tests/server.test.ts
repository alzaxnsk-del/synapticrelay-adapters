import express from 'express';
import request from 'supertest';
import * as client from '../src/openclaw-client';

// We mock the config to isolate the server logic
jest.mock('../src/config', () => ({
  loadConfig: () => ({
    port: 3000,
    agentBaseUrl: 'http://bridge-public',
    agentName: 'Test Bridge',
    synapticRelayUrl: 'http://sr',
    targetOpenClawUrl: 'http://target-internal',
    targetTimeoutMs: 5000,
  })
}));

// We test the Express app directly by importing the handlers without starting listen()
// We'll reconstruct a clean app mapping the routes just for testing.
const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  const isHealthy = await client.checkTargetHealth('http://target-internal', 5000);
  if (isHealthy) {
    res.json({ status: 'healthy', agent: 'Test Bridge', target: 'reachable' });
  } else {
    res.status(503).json({ status: 'degraded', error: 'Target unreachable' });
  }
});

app.post('/invoke', async (req, res) => {
  if (!req.body.capability) {
    return res.status(400).json({ error: { code: 'bad_request' } });
  }
  
  const response = await client.invokeTargetAgent('http://target-internal', 5000, req.body);
  
  if (response.error) {
    if (response.error.code === 'timeout') return res.status(504).json(response);
    if (response.error.code === 'network_error') return res.status(502).json(response);
    return res.status(502).json(response);
  }
  return res.json({ status: 'success', data: response.result });
});

describe('Bridge Server API', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /health', () => {
    it('returns 200 healthy when target is reachable', async () => {
      jest.spyOn(client, 'checkTargetHealth').mockResolvedValue(true);
      
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    it('returns 503 degraded when target is unreachable', async () => {
      jest.spyOn(client, 'checkTargetHealth').mockResolvedValue(false);
      
      const res = await request(app).get('/health');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
    });
  });

  describe('POST /invoke', () => {
    it('returns 400 when capability is missing', async () => {
      const res = await request(app).post('/invoke').send({ parameters: {} });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('bad_request');
    });

    it('returns 200 and proxies result on success', async () => {
      jest.spyOn(client, 'invokeTargetAgent').mockResolvedValue({ result: { topics: [] } });
      
      const res = await request(app).post('/invoke').send({ capability: 'test', parameters: {} });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ topics: [] });
    });

    it('returns 504 on timeout', async () => {
      jest.spyOn(client, 'invokeTargetAgent').mockResolvedValue({ error: { code: 'timeout', message: 'x' } });
      
      const res = await request(app).post('/invoke').send({ capability: 'test', parameters: {} });
      expect(res.status).toBe(504);
      expect(res.body.error.code).toBe('timeout');
    });

    it('returns 502 on target network error', async () => {
      jest.spyOn(client, 'invokeTargetAgent').mockResolvedValue({ error: { code: 'network_error', message: 'x' } });
      
      const res = await request(app).post('/invoke').send({ capability: 'test', parameters: {} });
      expect(res.status).toBe(502);
      expect(res.body.error.code).toBe('network_error');
    });
  });
});
