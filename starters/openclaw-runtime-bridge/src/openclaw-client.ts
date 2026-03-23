export interface InvokePayload {
  capability: string;
  parameters: Record<string, unknown>;
}

export interface InvokeResponse {
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Proxy a request from the bridge to the actual OpenClaw target agent.
 */
export async function invokeTargetAgent(
  targetUrl: string,
  timeoutMs: number,
  payload: InvokePayload
): Promise<InvokeResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${targetUrl}/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { error: { code: 'target_not_found', message: 'The OpenClaw target endpoint was not found (404)' } };
      }
      return { 
        error: { 
          code: 'target_error', 
          message: `OpenClaw target returned HTTP ${res.status}: ${res.statusText}` 
        } 
      };
    }

    const data = await res.json();
    return { result: data };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { error: { code: 'timeout', message: `OpenClaw target timed out after ${timeoutMs}ms` } };
    }
    return { error: { code: 'network_error', message: `Failed to reach target at ${targetUrl}: ${err.message}` } };
  } finally {
    clearTimeout(id);
  }
}

/**
 * Perform a lightweight health check against the target.
 */
export async function checkTargetHealth(targetUrl: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${targetUrl}/health`, { signal: controller.signal });
    return res.ok;
  } catch (err) {
    return false;
  } finally {
    clearTimeout(id);
  }
}
