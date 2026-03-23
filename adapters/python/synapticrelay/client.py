"""
SynapticRelay API Client for Python.

Covers the integration surface (/api/v1/integration/*) and marketplace
endpoints (/api/v1/market/*).
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
    """HTTP client for the SynapticRelay Integration Surface API."""

    def __init__(
        self,
        base_url: str,
        api_key: str | None = None,
        jwt_token: str | None = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.jwt_token = jwt_token
        self._client = httpx.Client(timeout=timeout)

    @classmethod
    def from_env(cls) -> "SynapticRelayClient":
        """Create client from environment variables.

        Reads:
            SYNAPTICRELAY_URL — base API URL (required)
            SYNAPTICRELAY_API_KEY — API key
            SYNAPTICRELAY_JWT — JWT token
            SYNAPTICRELAY_TIMEOUT — request timeout in seconds
        """
        base_url = os.environ.get("SYNAPTICRELAY_URL")
        if not base_url:
            raise ValueError(
                "SYNAPTICRELAY_URL environment variable is required. "
                "Set it to your SynapticRelay instance URL."
            )
        return cls(
            base_url=base_url,
            api_key=os.environ.get("SYNAPTICRELAY_API_KEY"),
            jwt_token=os.environ.get("SYNAPTICRELAY_JWT"),
            timeout=float(os.environ.get("SYNAPTICRELAY_TIMEOUT", "30")),
        )

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        return headers

    def _request(self, method: str, path: str, json: Any = None) -> Any:
        url = f"{self.base_url}{path}"
        response = self._client.request(method, url, headers=self._headers(), json=json)

        if response.status_code == 401:
            raise SynapticRelayError("Authentication failed", "AUTH_FAILED", 401)

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

    # ─── Runtime Registration ─────────────────────────────────────

    def register_runtime(
        self,
        name: str,
        runtime_type: str = "python",
        role: str = "supplier",
        description: str | None = None,
    ) -> dict[str, Any]:
        """Register a new runtime with SynapticRelay.

        Returns:
            dict with runtimeId and apiKey
        """
        data: dict[str, Any] = {"name": name, "type": runtime_type, "role": role}
        if description:
            data["description"] = description

        result = self._request("POST", "/api/v1/integration/runtimes", json=data)

        # Auto-store the API key
        if result and result.get("apiKey"):
            self.api_key = result["apiKey"]

        return result

    def get_runtime(self, runtime_id: str) -> dict[str, Any]:
        """Get runtime details."""
        return self._request("GET", f"/api/v1/integration/runtimes/{runtime_id}")

    def list_runtimes(self) -> list[dict[str, Any]]:
        """List all runtimes owned by the authenticated user."""
        return self._request("GET", "/api/v1/integration/runtimes")

    def delete_runtime(self, runtime_id: str) -> None:
        """Delete/deregister a runtime."""
        self._request("DELETE", f"/api/v1/integration/runtimes/{runtime_id}")

    def change_role(self, runtime_id: str, role: str) -> dict[str, Any]:
        """Change runtime role (supplier, buyer, both)."""
        return self._request(
            "POST", f"/api/v1/integration/runtimes/{runtime_id}/role", json={"role": role}
        )

    # ─── Manifest ─────────────────────────────────────────────────

    def submit_manifest(self, runtime_id: str, manifest: dict[str, Any]) -> dict[str, Any]:
        """Submit a runtime manifest."""
        return self._request(
            "POST", f"/api/v1/integration/runtimes/{runtime_id}/manifest", json=manifest
        )

    def get_manifest(self, runtime_id: str) -> dict[str, Any]:
        """Get the current manifest for a runtime."""
        return self._request("GET", f"/api/v1/integration/runtimes/{runtime_id}/manifest")

    # ─── Health ───────────────────────────────────────────────────

    def report_health(
        self,
        runtime_id: str,
        status: str = "healthy",
        version: str | None = None,
        capabilities: list[str] | None = None,
    ) -> None:
        """Report runtime health status."""
        data: dict[str, Any] = {"status": status}
        if version:
            data["version"] = version
        if capabilities:
            data["capabilities"] = capabilities
        self._request("POST", f"/api/v1/integration/runtimes/{runtime_id}/health", json=data)

    def get_health(self, runtime_id: str) -> dict[str, Any]:
        """Get runtime health status."""
        return self._request("GET", f"/api/v1/integration/runtimes/{runtime_id}/health")

    # ─── Actions & Trust ──────────────────────────────────────────

    def get_actions(self, runtime_id: str) -> list[dict[str, Any]]:
        """Get available actions for this runtime (role-aware)."""
        return self._request("GET", f"/api/v1/integration/runtimes/{runtime_id}/actions")

    def get_trust(self, runtime_id: str) -> dict[str, Any]:
        """Get trust/verification state."""
        return self._request("GET", f"/api/v1/integration/runtimes/{runtime_id}/trust")

    def get_contracts(self, runtime_id: str) -> list[dict[str, Any]]:
        """Get contracts involving this runtime."""
        return self._request("GET", f"/api/v1/integration/runtimes/{runtime_id}/contracts")

    # ─── Marketplace ──────────────────────────────────────────────

    def publish_service(
        self, title: str, description: str, category: str, price: float | None = None
    ) -> dict[str, Any]:
        """Publish a service listing."""
        data: dict[str, Any] = {"title": title, "description": description, "category": category}
        if price is not None:
            data["price"] = price
        return self._request("POST", "/api/v1/market/services", json=data)

    def create_order(
        self, goal: str, category: str | None = None, budget: float | None = None
    ) -> dict[str, Any]:
        """Create a marketplace order (buyer action)."""
        data: dict[str, Any] = {"goal": goal}
        if category:
            data["category"] = category
        if budget is not None:
            data["budget"] = budget
        return self._request("POST", "/api/v1/market/orders", json=data)

    def search_suppliers(
        self, agent_id: str, category_id: str | None = None, max_price: float | None = None, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Search the marketplace for suppliers directly."""
        params: dict[str, Any] = {"agentId": agent_id, "limit": limit}
        if category_id is not None:
            params["categoryId"] = category_id
        if max_price is not None:
            params["maxPrice"] = max_price
        
        return self._request(
            "POST", 
            "/api/v1/agent/action", 
            json={"action": "search_suppliers", "params": params}
        )

    def get_shortlist(self, order_id: str) -> list[dict[str, Any]]:
        """Get matching suppliers for an order."""
        return self._request("GET", f"/api/v1/market/orders/{order_id}/shortlist")

    def select_supplier(self, order_id: str, agent_id: str) -> dict[str, Any]:
        """Select a supplier from the shortlist."""
        return self._request(
            "POST", f"/api/v1/market/orders/{order_id}/shortlist", json={"agentId": agent_id}
        )

    def open_contract(
        self, order_id: str, supplier_id: str, terms: dict | None = None
    ) -> dict[str, Any]:
        """Open a contract with a selected supplier."""
        data: dict[str, Any] = {"orderId": order_id, "supplierId": supplier_id}
        if terms:
            data["terms"] = terms
        return self._request("POST", "/api/v1/market/contracts", json=data)

    def get_receipt(self, contract_id: str) -> dict[str, Any]:
        """Get receipt for a completed contract."""
        return self._request("GET", f"/api/v1/market/contracts/{contract_id}/receipt")
