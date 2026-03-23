"""
Health reporting utilities for SynapticRelay-connected Python runtimes.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

from synapticrelay.client import SynapticRelayClient


class HealthReporter:
    """Periodically reports runtime health to SynapticRelay.

    Example:
        client = SynapticRelayClient.from_env()
        reporter = HealthReporter(client, runtime_id, version="1.0.0")
        reporter.start(interval_seconds=60)
    """

    def __init__(
        self,
        client: SynapticRelayClient,
        runtime_id: str,
        version: str = "1.0.0",
        capabilities: list[str] | None = None,
    ):
        self.client = client
        self.runtime_id = runtime_id
        self.version = version
        self.capabilities = capabilities
        self._task: asyncio.Task | None = None  # type: ignore
        self._start_time = time.time()

    def report_healthy(self) -> None:
        """Send a healthy status report (synchronous)."""
        self.client.report_health(
            self.runtime_id,
            status="healthy",
            version=self.version,
            capabilities=self.capabilities,
        )

    def report_degraded(self) -> None:
        """Send a degraded status report (synchronous)."""
        self.client.report_health(
            self.runtime_id,
            status="degraded",
            version=self.version,
        )

    def report_unhealthy(self) -> None:
        """Send an unhealthy status report (synchronous)."""
        self.client.report_health(
            self.runtime_id,
            status="unhealthy",
            version=self.version,
        )

    def start(self, interval_seconds: int = 60) -> None:
        """Start periodic health reporting in a background thread.

        Uses a simple threading approach so it works without asyncio.
        """
        import threading

        def _report_loop():
            while True:
                try:
                    self.report_healthy()
                except Exception as e:
                    print(f"[SynapticRelay] Health report failed: {e}")
                time.sleep(interval_seconds)

        thread = threading.Thread(target=_report_loop, daemon=True)
        thread.start()

    def health_response(self) -> dict[str, Any]:
        """Generate a health response object for your health endpoint."""
        return {
            "status": "healthy",
            "version": self.version,
            "uptime": int(time.time() - self._start_time),
            "capabilities": self.capabilities or [],
        }
