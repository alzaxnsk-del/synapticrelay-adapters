# Prompt for AI Developer: SynapticRelay Pull-Based SDK

**Цель:** Переписать устаревший репозиторий [synapticrelay-adapters](file:///Users/anizakharov/Documents/synapticrelay-adapters) (работавший по Push-модели на основе Webhooks/Express) и превратить его в библиотеку из трех стандартизированных легковесных SDK (NodeJS, Python, Golang), работающих по Pull-модели (polling).

Скопируйте следующий текст и отправьте его вашему ИИ-разработчику (например, в Cursor, Claude или ChatGPT):

***

```markdown
# Context
You are a Senior Systems Architect and Library Developer.
I have a GitHub repository `synapticrelay-adapters` that previously contained a Node.js Express server (`openclaw-bridge`) acting as a Webhook proxy for AI agents on the SynapticRelay platform. 

**This architecture is deprecated.** We are moving away from Webhooks (Push model) because it requires open ports, SSL, and public IPs from every developer. 

Your task is to **DELETE ALL existing code in this repository** and create a clean, multi-language SDK monorepo. We need 3 native SDK clients (Python, Node.js, and Golang) that use a simple **Pull model (Polling)** to fetch tasks.

# Repository Structure
Create three directories in the root:
- `/python` (Python SDK with setup.py / pyproject.toml)
- `/nodejs` (TypeScript SDK with package.json)
- `/golang` (Go module with go.mod)

# Technical Requirements for the SDK
Each SDK must implement a `SupplierClient` (or similarly named struct/class) that does the following:

## 1. Initialization
The client must accept:
- `api_key` (String, required)
- `agent_id` (String, required)
- `api_url` (String, default: `https://synapticrelay.com/api/v1/agent/action`)
- `polling_interval` (Integer, default: 30 seconds)

## 2. API Communication
All API requests must be `POST` requests sending a JSON body with the format:
`{"action": "<ACTION_NAME>", "params": { ... }}`
Headers must include:
- `Content-Type: application/json`
- `X-API-Key: <api_key>`
- `User-Agent: SynapticRelay-SDK/<lang>-1.0`

## 3. The Polling Loop (`start_polling`)
When started, the SDK should enter an infinite loop (or use `setInterval` / Goroutines) that runs every `polling_interval` seconds:

1. Call `get_supplier_runs` API:
   `{"action": "get_supplier_runs", "params": {"supplierAgentId": agent_id, "status": "queued"}}`
   If the response contains `data.data.runs` (an array of run objects), proceed to step 2 for each run.
   
2. For each run, fire an API call to `start_run`:
   `{"action": "start_run", "params": {"runId": run.id}}`
   
3. Pass the full `run` object to the developer's registered callback/handler function.
   
4. The developer's handler must return a result (String or Dict). Wrap this result in a `try/except` blocking error gracefully.
   
5. Call `deliver_result` API to complete the task:
   `{"action": "deliver_result", "params": {"runId": run.id, "deliveryPayload": <RESULT_FROM_HANDLER>}}`

## 4. Developer Experience (API Design)
The SDK should be extremely "plug and play".

**Python Example:**
```python
from synapticrelay import SupplierClient

client = SupplierClient(agent_id="YOUR_AGENT_ID", api_key="YOUR_API_KEY")

@client.on_task
def handle_task(run_context):
    query = run_context.get("taskDescription")
    return {"result": f"I processed the task: {query}"}

client.start_polling()
```

**Node.js Example:**
```javascript
import { SupplierClient } from '@synapticrelay/sdk';

const client = new SupplierClient({ agentId: "YOUR_AGENT_ID", apiKey: "YOUR_API_KEY" });

client.onTask(async (runContext) => {
    const query = runContext.taskDescription;
    return { result: `I processed the task: ${query}` };
});

client.startPolling();
```

**Golang Example:**
```go
package main

import "github.com/alzaxnsk-del/synapticrelay-adapters/golang/sdk"

func main() {
    client := sdk.NewSupplierClient("YOUR_AGENT_ID", "YOUR_API_KEY")
    
    client.OnTask(func(runContext sdk.RunContext) (interface{}, error) {
        return map[string]string{"result": "I processed the task"}, nil
    })
    
    client.StartPolling()
}
```

# Tasks
1. Generate the `/nodejs` SDK with TypeScript setup, compiling to commonjs/esm.
2. Generate the `/python` SDK with poetry or setup.py, using the standard `requests` or `urllib` library to keep dependencies light.
3. Generate the `/golang` SDK using standard `net/http` package.
4. Add a `README.md` in the root explaining the new Pull-based architecture and providing the exact usage examples above.
5. All code must be production-ready, featuring graceful error handling (e.g., API timeouts shouldn't crash the polling loop).
```
***

Просто скопируйте блок выше, и любая умная модель вроде Claude 3.5 Sonnet полностью перепишет ваш репозиторий в 3 крутых SDK.
