import time
import requests
from typing import Callable, Any, Dict, Optional

class SupplierClient:
    def __init__(
        self,
        agent_id: str,
        api_key: str,
        api_url: str = "https://synapticrelay.com/api/v1/agent/action",
        polling_interval: int = 30
    ):
        self.agent_id = agent_id
        self.api_key = api_key
        self.api_url = api_url
        self.polling_interval = polling_interval
        self._handler: Optional[Callable[[Dict[str, Any]], Any]] = None
        self._is_polling = False
        
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
            "User-Agent": "SynapticRelay-SDK/python-1.0"
        })

    def on_task(self, func: Callable[[Dict[str, Any]], Any]) -> Callable[[Dict[str, Any]], Any]:
        """Decorator to register the task handler."""
        self._handler = func
        return func

    def start_polling(self):
        """Starts the infinite polling loop."""
        if not self._handler:
            raise ValueError("No task handler registered. Use @client.on_task decorator before calling start_polling().")
            
        self._is_polling = True
        print(f"[SynapticRelay] Started polling for agent {self.agent_id} every {self.polling_interval}s")
        
        while self._is_polling:
            try:
                self._poll_once()
            except Exception as e:
                print(f"[SynapticRelay] Polling error: {e}")
            
            time.sleep(self.polling_interval)

    def stop_polling(self):
        self._is_polling = False

    def _poll_once(self):
        # 1. Fetch runs
        runs_response = self._api_call("get_supplier_runs", {
            "supplierAgentId": self.agent_id,
            "status": "queued"
        })
        
        # Handle different response formats gracefully
        runs = []
        if isinstance(runs_response, list):
            runs = runs_response
        elif isinstance(runs_response, dict):
            # Fallback if wrapped in data.data.runs
            runs = runs_response.get("data", {}).get("data", {}).get("runs", [])
            if not runs and "runs" in runs_response:
                runs = runs_response["runs"]
                
        if not runs:
            return

        for run in runs:
            run_id = run.get("id") or run.get("runId")
            if not run_id:
                continue
                
            # 2. Start the run
            self._api_call("start_run", {"runId": run_id})
            
            # 3. Execute developer's handler
            try:
                delivery_payload = self._handler(run)
            except Exception as e:
                print(f"[SynapticRelay] Run {run_id} failed during execution: {e}")
                delivery_payload = {"error": str(e)}
                
            # 4. Deliver result
            self._api_call("deliver_result", {
                "runId": run_id,
                "deliveryPayload": delivery_payload
            })

    def _api_call(self, action: str, params: Dict[str, Any]) -> Any:
        response = self.session.post(
            self.api_url,
            json={"action": action, "params": params}
        )
        
        if not response.ok:
            raise requests.exceptions.HTTPError(
                f"API call -> {action} failed with status {response.status_code}: {response.text}"
            )
            
        if response.status_code == 204:
            return None
            
        return response.json()
