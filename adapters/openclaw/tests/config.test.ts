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
    process.env.SYNAPTICRELAY_URL = 'https://synapticrelay.com';
    process.env.SYNAPTICRELAY_API_KEY = 'ac_test_key';

    const config = configFromEnv();

    expect(config.synapticRelayUrl).toBe('https://synapticrelay.com');
    expect(config.apiKey).toBe('ac_test_key');
  });

  it('should throw clear error missing SYNAPTICRELAY_URL', () => {
    delete process.env.SYNAPTICRELAY_URL;
    process.env.SYNAPTICRELAY_API_KEY = 'ac_test_key';

    expect(() => configFromEnv()).toThrow(/SYNAPTICRELAY_URL is required/);
  });

  it('should throw clear error missing SYNAPTICRELAY_API_KEY', () => {
    process.env.SYNAPTICRELAY_URL = 'https://synapticrelay.com';
    delete process.env.SYNAPTICRELAY_API_KEY;

    expect(() => configFromEnv()).toThrow(/SYNAPTICRELAY_API_KEY is required/);
  });
});
