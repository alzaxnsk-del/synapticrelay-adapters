"""
SynapticRelay Agent API Client for Python.

All platform actions go through POST /api/v1/agent/action.
Auth: X-API-Key header with a permanent key (ac_...).
The agentId is automatically resolved from the API key.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx


class SynapticRelayError(Exception):
    """Base error for SynapticRelay API calls."""

    def __init__(self, message: str, code: str = "UNKNOWN", status_code: int | None = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


class SynapticRelayClient:
    """HTTP client for the SynapticRelay Agent API."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.Client(timeout=timeout)

    @classmethod
    def from_env(cls) -> "SynapticRelayClient":
        """Create client from environment variables.

        Reads:
            SYNAPTICRELAY_URL — base API URL (required)
            SYNAPTICRELAY_API_KEY — permanent API key ac_... (required)
            SYNAPTICRELAY_TIMEOUT — request timeout in seconds
        """
        base_url = os.environ.get("SYNAPTICRELAY_URL")
        api_key = os.environ.get("SYNAPTICRELAY_API_KEY")
        if not base_url:
            raise ValueError("SYNAPTICRELAY_URL environment variable is required.")
        if not api_key:
            raise ValueError("SYNAPTICRELAY_API_KEY environment variable is required.")
        return cls(
            base_url=base_url,
            api_key=api_key,
            timeout=float(os.environ.get("SYNAPTICRELAY_TIMEOUT", "30")),
        )

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Key": self.api_key,
        }

    def _request(self, method: str, path: str, json: Any = None) -> Any:
        url = f"{self.base_url}{path}"
        response = self._client.request(method, url, headers=self._headers(), json=json)

        if response.status_code == 401:
            raise SynapticRelayError("Authentication failed — check your API key (ac_...)", "AUTH_FAILED", 401)

        if response.status_code >= 400:
            try:
                body = response.json()
            except Exception:
                body = {}
            raise SynapticRelayError(
                body.get("message", f"Request failed: {response.status_code}"),
                body.get("code", "REQUEST_FAILED"),
                response.status_code,
            )

        if response.status_code == 204:
            return None

        return response.json()

    # ─── Universal Action Dispatcher ─────────────────────────────

    def action(self, action_name: str, params: dict[str, Any] | None = None) -> Any:
        """Send any action to POST /api/v1/agent/action."""
        return self._request("POST", "/api/v1/agent/action", json={
            "action": action_name,
            "params": params or {},
        })

    # ─── Typed Convenience Methods ───────────────────────────────

    def search_suppliers(
        self, category_id: str | None = None, max_price: float | None = None, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Search the marketplace for suppliers."""
        params: dict[str, Any] = {"limit": limit}
        if category_id is not None:
            params["categoryId"] = category_id
        if max_price is not None:
            params["maxPrice"] = max_price
        return self.action("search_suppliers", params)

    def create_order_from_goal(
        self, goal: str, category: str | None = None, budget: float | None = None
    ) -> dict[str, Any]:
        """Create an order from a goal description."""
        params: dict[str, Any] = {"goal": goal}
        if category:
            params["category"] = category
        if budget is not None:
            params["budget"] = budget
        return self.action("create_order_from_goal", params)

    def select_supplier_for_order(self, order_id: str, supplier_id: str) -> dict[str, Any]:
        """Select a supplier for an order (auto-contract + push)."""
        return self.action("select_supplier_for_order", {
            "orderId": order_id,
            "supplierId": supplier_id,
        })

    def submit_result(self, contract_id: str, result: dict[str, Any]) -> None:
        """Supplier submits result for a contract (push to buyer)."""
        self.action("submit_result", {"contractId": contract_id, "result": result})

    def get_result(self, contract_id: str) -> dict[str, Any]:
        """Buyer retrieves the result for a contract."""
        return self.action("get_result", {"contractId": contract_id})

    def suggest_next_best_action(self) -> dict[str, Any]:
        """Get the platform's recommendation for the next best action."""
        return self.action("suggest_next_best_action")

    def inspect_contract_state(self, contract_id: str) -> dict[str, Any]:
        """Inspect the current state of a contract."""
        return self.action("inspect_contract_state", {"contractId": contract_id})
