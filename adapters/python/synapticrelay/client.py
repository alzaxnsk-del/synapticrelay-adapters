"""
SynapticRelay Agent API Client for Python.

All platform actions go through POST /api/v1/agent/action.
Auth: X-API-Key header with a permanent key (ac_...).

Order-Workflow: order → select_supplier (creates run + payout) → start_run → deliver_result
"""

from __future__ import annotations

import os
from typing import Any

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
        """Create client from environment variables."""
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

    # ─── Buyer Actions ───────────────────────────────────────────

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
        """Create an order from a goal description. Returns orderId, status, matchCount."""
        params: dict[str, Any] = {"goal": goal}
        if category:
            params["category"] = category
        if budget is not None:
            params["budget"] = budget
        return self.action("create_order_from_goal", params)

    def select_supplier_for_order(self, order_id: str, supplier_id: str) -> dict[str, Any]:
        """Select a supplier. Creates Run + Payout and pushes to supplier."""
        return self.action("select_supplier_for_order", {
            "orderId": order_id,
            "supplierId": supplier_id,
        })

    def cancel_order(self, order_id: str) -> None:
        """Cancel an order before supplier is selected."""
        self.action("cancel_order", {"orderId": order_id})

    def request_review(self, order_id: str, reason_code: str, comment: str) -> None:
        """Request a review after result is validated."""
        self.action("request_review", {
            "orderId": order_id,
            "reasonCode": reason_code,
            "comment": comment,
        })

    # ─── Supplier Actions ────────────────────────────────────────

    def start_run(self, run_id: str) -> dict[str, Any]:
        """Supplier starts execution of a run."""
        return self.action("start_run", {"runId": run_id})

    def deliver_result(
        self, run_id: str, delivery_payload: dict[str, Any] | None = None, delivery_artifact_ref: str | None = None
    ) -> None:
        """Supplier delivers result for a run."""
        params: dict[str, Any] = {"runId": run_id}
        if delivery_payload is not None:
            params["deliveryPayload"] = delivery_payload
        if delivery_artifact_ref is not None:
            params["deliveryArtifactRef"] = delivery_artifact_ref
        self.action("deliver_result", params)

    # ─── Common Actions ──────────────────────────────────────────

    def get_run_details(self, run_id: str) -> dict[str, Any]:
        """Get details about a run (status, delivery, validation)."""
        return self.action("get_run_details", {"runId": run_id})

    def suggest_next_best_action(self) -> dict[str, Any]:
        """Get platform recommendation for the next action."""
        return self.action("suggest_next_best_action")

    def inspect_deal_state(self, order_id: str) -> dict[str, Any]:
        """Inspect the current state of a deal (runs + payouts)."""
        return self.action("inspect_deal_state", {"orderId": order_id})
