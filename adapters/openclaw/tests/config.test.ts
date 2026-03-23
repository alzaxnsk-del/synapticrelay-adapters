import { configFromEnv } from '../src/config';

describe('OpenClaw Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should parse valid environment variables', () => {
    process.env.SYNAPTICRELAY_URL = 'https://api.synapticrelay.io';
    process.env.OPENCLAW_AGENT_NAME = 'Test Agent';
    process.env.OPENCLAW_AGENT_URL = 'http://localhost:3000';
    process.env.OPENCLAW_ROLE = 'buyer';

    const config = configFromEnv();

    expect(config.synapticRelayUrl).toBe('https://api.synapticrelay.io');
    expect(config.agentName).toBe('Test Agent');
    expect(config.agentBaseUrl).toBe('http://localhost:3000');
    expect(config.role).toBe('buyer');
    expect(config.version).toBe('1.0.0'); // defaults
    expect(config.invocationMode).toBe('sync');
  });

  it('should throw clear error missing SYNAPTICRELAY_URL', () => {
    delete process.env.SYNAPTICRELAY_URL;
    process.env.OPENCLAW_AGENT_NAME = 'Test Agent';
    process.env.OPENCLAW_AGENT_URL = 'http://localhost:3000';

    expect(() => configFromEnv()).toThrow(/SYNAPTICRELAY_URL is required/);
    expect(() => configFromEnv()).toThrow(/local mock: set to http:\/\/localhost:9999/);
    expect(() => configFromEnv()).toThrow(/real integration: set to https:\/\/api.synapticrelay.io/);
  });

  it('should throw clear error missing OPENCLAW_AGENT_NAME', () => {
    process.env.SYNAPTICRELAY_URL = 'https://api.synapticrelay.io';
    delete process.env.OPENCLAW_AGENT_NAME;
    process.env.OPENCLAW_AGENT_URL = 'http://localhost:3000';

    expect(() => configFromEnv()).toThrow(/OPENCLAW_AGENT_NAME is required/);
  });

  it('should throw clear error on invalid role', () => {
    process.env.SYNAPTICRELAY_URL = 'https://api.synapticrelay.io';
    process.env.OPENCLAW_AGENT_NAME = 'Test Agent';
    process.env.OPENCLAW_AGENT_URL = 'http://localhost:3000';
    process.env.OPENCLAW_ROLE = 'invalid_role';

    expect(() => configFromEnv()).toThrow(/Invalid OPENCLAW_ROLE: invalid_role/);
  });
});
