"""
Manifest builder and validator for Python agent runtimes.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def validate_manifest(manifest: dict[str, Any]) -> tuple[bool, list[str]]:
    """Validate a manifest against basic spec requirements.

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors: list[str] = []

    # Required top-level fields
    if manifest.get("specVersion") != "1.0":
        errors.append("specVersion must be '1.0'")

    runtime = manifest.get("runtime")
    if not isinstance(runtime, dict):
        errors.append("runtime object is required")
    else:
        if not runtime.get("name"):
            errors.append("runtime.name is required")
        if runtime.get("type") not in ("openclaw", "python", "node", "mcp", "http", "custom"):
            errors.append("runtime.type must be one of: openclaw, python, node, mcp, http, custom")
        if not runtime.get("version"):
            errors.append("runtime.version is required")

    role = manifest.get("role")
    if role not in ("supplier", "buyer", "both"):
        errors.append("role must be one of: supplier, buyer, both")

    endpoints = manifest.get("endpoints")
    if not isinstance(endpoints, dict):
        errors.append("endpoints object is required")
    elif not endpoints.get("health"):
        errors.append("endpoints.health is required")

    # Semantic checks
    if role in ("supplier", "both"):
        caps = manifest.get("capabilities")
        if not caps or len(caps) == 0:
            errors.append("capabilities are required when role is 'supplier' or 'both'")
        if isinstance(endpoints, dict) and not endpoints.get("invoke"):
            errors.append("endpoints.invoke is required when role is 'supplier' or 'both'")

    return (len(errors) == 0, errors)


class ManifestBuilder:
    """Fluent builder for creating valid SynapticRelay manifests.

    Example:
        manifest = (
            ManifestBuilder("My Agent", "python", "1.0.0")
            .role("supplier")
            .description("A helpful agent")
            .health_endpoint("http://localhost:8000/health")
            .invoke_endpoint("http://localhost:8000/invoke")
            .add_capability("summarize", "Summarize documents")
            .build()
        )
    """

    def __init__(self, name: str, runtime_type: str, version: str):
        self._manifest: dict[str, Any] = {
            "specVersion": "1.0",
            "runtime": {
                "name": name,
                "type": runtime_type,
                "version": version,
            },
            "role": "supplier",
            "endpoints": {"health": ""},
        }

    def role(self, role: str) -> "ManifestBuilder":
        """Set the runtime role (supplier, buyer, both)."""
        self._manifest["role"] = role
        return self

    def description(self, desc: str) -> "ManifestBuilder":
        """Set runtime description."""
        self._manifest["runtime"]["description"] = desc
        return self

    def homepage(self, url: str) -> "ManifestBuilder":
        """Set runtime homepage URL."""
        self._manifest["runtime"]["homepage"] = url
        return self

    def health_endpoint(self, url: str) -> "ManifestBuilder":
        """Set the health check endpoint."""
        self._manifest["endpoints"]["health"] = url
        return self

    def invoke_endpoint(self, url: str) -> "ManifestBuilder":
        """Set the invocation endpoint."""
        self._manifest["endpoints"]["invoke"] = url
        return self

    def status_endpoint(self, url: str) -> "ManifestBuilder":
        """Set the status polling endpoint."""
        self._manifest["endpoints"]["status"] = url
        return self

    def webhook_endpoint(self, url: str) -> "ManifestBuilder":
        """Set the webhook callback endpoint."""
        self._manifest["endpoints"]["webhook"] = url
        return self

    def add_capability(
        self,
        name: str,
        description: str,
        input_schema: dict | None = None,
        output_schema: dict | None = None,
        category: str | None = None,
        tags: list[str] | None = None,
    ) -> "ManifestBuilder":
        """Add a capability to the manifest."""
        if "capabilities" not in self._manifest:
            self._manifest["capabilities"] = []

        cap: dict[str, Any] = {"name": name, "description": description}
        if input_schema:
            cap["inputSchema"] = input_schema
        if output_schema:
            cap["outputSchema"] = output_schema
        if category:
            cap["category"] = category
        if tags:
            cap["tags"] = tags

        self._manifest["capabilities"].append(cap)
        return self

    def invocation(
        self,
        mode: str = "sync",
        timeout_ms: int = 30000,
        max_concurrency: int = 10,
        retryable: bool = True,
    ) -> "ManifestBuilder":
        """Set invocation configuration."""
        self._manifest["invocation"] = {
            "mode": mode,
            "timeoutMs": timeout_ms,
            "maxConcurrency": max_concurrency,
            "retryable": retryable,
        }
        return self

    def auth(self, auth_type: str = "api_key", header_name: str = "X-API-Key") -> "ManifestBuilder":
        """Set auth configuration."""
        self._manifest["auth"] = {"type": auth_type, "headerName": header_name}
        return self

    def settlement(self, supported: bool = False, methods: list[str] | None = None) -> "ManifestBuilder":
        """Set settlement configuration."""
        data: dict[str, Any] = {"supported": supported}
        if methods:
            data["methods"] = methods
        self._manifest["settlement"] = data
        return self

    def metadata(self, **kwargs: Any) -> "ManifestBuilder":
        """Set arbitrary metadata."""
        self._manifest.setdefault("metadata", {}).update(kwargs)
        return self

    def build(self) -> dict[str, Any]:
        """Build and validate the manifest. Raises ValueError if invalid."""
        valid, errors = validate_manifest(self._manifest)
        if not valid:
            raise ValueError(f"Invalid manifest: {'; '.join(errors)}")
        return dict(self._manifest)

    def build_unchecked(self) -> dict[str, Any]:
        """Build without validation (useful during development)."""
        return dict(self._manifest)

    def to_json(self, indent: int = 2) -> str:
        """Serialize manifest to JSON string."""
        return json.dumps(self.build(), indent=indent)

    def to_file(self, path: str | Path) -> None:
        """Write manifest to a JSON file."""
        Path(path).write_text(self.to_json())
