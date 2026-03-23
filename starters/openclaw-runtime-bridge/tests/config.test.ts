import { loadConfig } from '../src/config';

describe('Bridge Config Parser', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should parse valid environment variables', () => {
    process.env.SYNAPTICRELAY_URL = 'http://localhost:9999';
    process.env.OPENCLAW_AGENT_NAME = 'Bridge Test Agent';
    process.env.OPENCLAW_AGENT_URL = 'http://localhost:3000';
    process.env.OPENCLAW_TARGET_URL = 'http://localhost:8080';

    const config = loadConfig();

    expect(config.synapticRelayUrl).toBe('http://localhost:9999');
    expect(config.agentName).toBe('Bridge Test Agent');
    expect(config.agentBaseUrl).toBe('http://localhost:3000');
    expect(config.targetOpenClawUrl).toBe('http://localhost:8080');
    expect(config.targetTimeoutMs).toBe(30000); // defaults
  });

  it('should throw clear error on missing target URL', () => {
    process.env.SYNAPTICRELAY_URL = 'http://localhost:9999';
    process.env.OPENCLAW_AGENT_NAME = 'Bridge Test Agent';
    process.env.OPENCLAW_AGENT_URL = 'http://localhost:3000';
    delete process.env.OPENCLAW_TARGET_URL;

    expect(() => loadConfig()).toThrow(/OPENCLAW_TARGET_URL is required/);
  });
});
