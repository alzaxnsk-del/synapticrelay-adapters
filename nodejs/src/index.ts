export interface SupplierConfig {
  agentId: string;
  apiKey: string;
  apiUrl?: string;
  pollingInterval?: number;
}

export interface RunContext {
  id: string; // runId
  orderId: string;
  [key: string]: any;
}

export type TaskHandler = (runContext: RunContext) => Promise<any> | any;

export class SupplierClient {
  private agentId: string;
  private apiKey: string;
  private apiUrl: string;
  private pollingInterval: number;
  private handler: TaskHandler | null = null;
  private isPolling: boolean = false;

  constructor(config: SupplierConfig) {
    this.agentId = config.agentId;
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://synapticrelay.com/api/v1/agent/action';
    this.pollingInterval = config.pollingInterval || 30;
  }

  public onTask(handler: TaskHandler): void {
    this.handler = handler;
  }

  public async startPolling(): Promise<void> {
    if (!this.handler) {
      throw new Error("No task handler registered. Call onTask() before startPolling().");
    }

    this.isPolling = true;
    console.log(`[SynapticRelay] Started polling for agent ${this.agentId} every ${this.pollingInterval}s`);

    while (this.isPolling) {
      try {
        await this.pollOnce();
      } catch (error) {
        console.error(`[SynapticRelay] Polling error:`, error instanceof Error ? error.message : error);
      }
      await new Promise(resolve => setTimeout(resolve, this.pollingInterval * 1000));
    }
  }

  public stopPolling(): void {
    this.isPolling = false;
  }

  private async pollOnce(): Promise<void> {
    const runs = await this.apiCall('get_supplier_runs', {
      supplierAgentId: this.agentId,
      status: 'queued'
    });

    if (!Array.isArray(runs) || runs.length === 0) {
      return;
    }

    for (const run of runs) {
      // 1. Start the run
      await this.apiCall('start_run', { runId: run.id || run.runId });

      // 2. Execute developer's callback
      let deliveryPayload: any;
      try {
        deliveryPayload = await this.handler!(run);
      } catch (error) {
        console.error(`[SynapticRelay] Run ${run.id || run.runId} failed during execution:`, error);
        deliveryPayload = { error: error instanceof Error ? error.message : String(error) };
      }

      // 3. Deliver result
      await this.apiCall('deliver_result', {
        runId: run.id || run.runId,
        deliveryPayload
      });
    }
  }

  private async apiCall(action: string, params: any): Promise<any> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'User-Agent': 'SynapticRelay-SDK/nodejs-1.0'
      },
      body: JSON.stringify({ action, params })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API call -> ${action} failed with status ${response.status}: ${text}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    const data = await response.json();
    return data;
  }
}
