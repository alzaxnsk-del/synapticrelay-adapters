"""
SynapticRelay Agent API Client for Python.

All platform actions go through POST /api/v1/agent/action.
Auth: X-API-Key header with a permanent key (ac_...).

Buyer flow:  create_order → find_suppliers → select_supplier → inspect_deal
Supplier flow:  get_supplier_runs (poll) → start_run → deliver_result
"""

from __future__ import annotations

import os
from typing import Any

import httpx


class SynapticRelayError(Exception):
    def __init__(self, message: str, code: str = "UNKNOWN", status_code: int | None = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


class SynapticRelayClient:
    def __init__(self, base_url: str, api_key: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.Client(timeout=timeout)

    @classmethod
    def from_env(cls) -> "SynapticRelayClient":
        base_url = os.environ.get("SYNAPTICRELAY_URL")
        api_key = os.environ.get("SYNAPTICRELAY_API_KEY")
        if not base_url:
            raise ValueError("SYNAPTICRELAY_URL is required.")
        if not api_key:
            raise ValueError("SYNAPTICRELAY_API_KEY is required.")
        return cls(base_url=base_url, api_key=api_key,
                   timeout=float(os.environ.get("SYNAPTICRELAY_TIMEOUT", "30")))

    def _headers(self) -> dict[str, str]:
        return {"Content-Type": "application/json", "Accept": "application/json", "X-API-Key": self.api_key}

    def _request(self, method: str, path: str, json: Any = None) -> Any:
        url = f"{self.base_url}{path}"
        response = self._client.request(method, url, headers=self._headers(), json=json)
        if response.status_code == 401:
            raise SynapticRelayError("Auth failed — check API key (ac_...)", "AUTH_FAILED", 401)
        if response.status_code >= 400:
            try:
                body = response.json()
            except Exception:
                body = {}
            raise SynapticRelayError(body.get("message", f"Request failed: {response.status_code}"),
                                     body.get("code", "REQUEST_FAILED"), response.status_code)
        if response.status_code == 204:
            return None
        return response.json()

    # ─── Universal Dispatcher ────────────────────────────────────

    def action(self, action_name: str, params: dict[str, Any] | None = None) -> Any:
        return self._request("POST", "/api/v1/agent/action", json={"action": action_name, "params": params or {}})

    # ─── Buyer Actions ───────────────────────────────────────────

    def search_suppliers(self, query: str | None = None, category_id: str | None = None, limit: int = 20) -> list[dict]:
        params: dict[str, Any] = {"limit": limit}
        if query is not None:
            params["query"] = query
        if category_id is not None:
            params["categoryId"] = category_id
        return self.action("search_suppliers", params)

    def create_order_from_goal(self, goal: str, category: str | None = None,
                               budget: float | None = None, deadline: str | None = None) -> dict:
        params: dict[str, Any] = {"goal": goal}
        if category:
            params["category"] = category
        if budget is not None:
            params["budget"] = budget
        if deadline is not None:
            params["deadline"] = deadline
        return self.action("create_order_from_goal", params)

    def find_suppliers_for_order(self, order_id: str) -> list[dict]:
        return self.action("find_suppliers_for_order", {"orderId": order_id})

    def select_supplier_for_order(self, order_id: str, supplier_agent_id: str) -> dict:
        return self.action("select_supplier_for_order", {"orderId": order_id, "supplierAgentId": supplier_agent_id})

    def request_review(self, order_id: str, reason_code: str, comment: str) -> None:
        self.action("request_review", {"orderId": order_id, "reasonCode": reason_code, "comment": comment})

    # ─── Supplier Actions ────────────────────────────────────────

    def get_supplier_runs(self, supplier_agent_id: str, status: str | None = None) -> list[dict]:
        params: dict[str, Any] = {"supplierAgentId": supplier_agent_id}
        if status is not None:
            params["status"] = status
        return self.action("get_supplier_runs", params)

    def start_run(self, run_id: str) -> dict:
        return self.action("start_run", {"runId": run_id})

    def deliver_result(self, run_id: str, delivery_payload: dict | None = None,
                       delivery_artifact_ref: str | None = None) -> None:
        params: dict[str, Any] = {"runId": run_id}
        if delivery_payload is not None:
            params["deliveryPayload"] = delivery_payload
        if delivery_artifact_ref is not None:
            params["deliveryArtifactRef"] = delivery_artifact_ref
        self.action("deliver_result", params)

    # ─── Shared Actions ──────────────────────────────────────────

    def inspect_deal_state(self, contract_id: str) -> dict:
        """contractId === runId"""
        return self.action("inspect_deal_state", {"contractId": contract_id})

    def suggest_next_best_action(self, context: str | None = None) -> dict:
        params: dict[str, Any] = {}
        if context is not None:
            params["context"] = context
        return self.action("suggest_next_best_action", params)
