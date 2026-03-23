import express from 'express';
import request from 'supertest';
import * as client from '../src/openclaw-client';

jest.mock('../src/config', () => {
  let mockRole: 'supplier' | 'buyer' | 'both' = 'supplier'; // Define mockRole here
  const sharedState = {
    port: 3000,
    agentBaseUrl: 'http://bridge-public',
    agentId: 'rt_123',
    get role() { return mockRole; },
    set role(newRole: 'supplier' | 'buyer' | 'both') { mockRole = newRole; }, // Add setter for role
    synapticRelayUrl: 'http://sr',
    connectToken: 'token_123',
    targetOpenClawUrl: 'http://target-internal',
    targetTimeoutMs: 5000,
  };
  return {
    loadConfig: () => sharedState,
    __getMockConfig: () => sharedState,
  };
});

const { __getMockConfig } = require('../src/config');
const mockConfig = __getMockConfig();

import { app } from '../src/server';

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
      expect(res.body.agentId).toBe('rt_123');
    });
  });

  describe('POST /invoke (Role tests)', () => {
    it('returns 404 if role is buyer', async () => {
      // Temporarily mock role dynamically
      mockConfig.role = 'buyer';
      const res = await request(app).post('/invoke').send({ capability: 'test', parameters: {} });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('not_found');
      // Reset
      mockConfig.role = 'supplier';
    });
    
    it('returns 200 and proxies result on success', async () => {
      mockConfig.role = 'supplier';
      jest.spyOn(client, 'invokeTargetAgent').mockResolvedValue({ result: { topics: [] } });
      const res = await request(app).post('/invoke').send({ capability: 'test', parameters: {} });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ topics: [] });
    });
  });

  describe('POST /webhook', () => {
    it('returns 404 if role is supplier', async () => {
      mockConfig.role = 'supplier';
      const res = await request(app).post('/webhook').send({ type: 'order_created' });
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('not_found');
    });

    it('returns 200 received if role is buyer and target succeeds', async () => {
      mockConfig.role = 'buyer';
      jest.spyOn(client, 'forwardWebhook').mockResolvedValue(true);
      const res = await request(app).post('/webhook').send({ type: 'order_created' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('received');
      mockConfig.role = 'supplier'; // Reset
    });
  });
});
