import { invokeTargetAgent } from '../src/openclaw-client';

// Simple mockup of native fetch
global.fetch = jest.fn();

describe('OpenClaw Client Proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should proxy successful invoke requests', async () => {
    const mockResponseData = { topics: ['AI', 'agents'] };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    const result = await invokeTargetAgent('http://fake-target', 5000, {
      capability: 'analyze',
      parameters: { text: 'hello' }
    });

    expect(global.fetch).toHaveBeenCalledWith('http://fake-target/invoke', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        capability: 'analyze',
        parameters: { text: 'hello' }
      })
    }));

    expect(result.error).toBeUndefined();
    expect(result.result).toEqual(mockResponseData);
  });

  it('should catch 404 network errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const result = await invokeTargetAgent('http://fake-target', 5000, {
      capability: 'analyze',
      parameters: {}
    });

    expect(result.error?.code).toBe('target_not_found');
  });

  it('should catch timeouts', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce({ name: 'AbortError' });

    const result = await invokeTargetAgent('http://fake-target', 5000, {
      capability: 'analyze',
      parameters: {}
    });

    expect(result.error?.code).toBe('timeout');
  });
});
