"""
SynapticRelay Python Adapter

Connect your Python agent runtime to the SynapticRelay marketplace.

Quick start:
    from synapticrelay import SynapticRelayClient, ManifestBuilder

    client = SynapticRelayClient.from_env()

    manifest = (
        ManifestBuilder("My Agent", "python", "1.0.0")
        .role("supplier")
        .health_endpoint("http://localhost:8000/health")
        .invoke_endpoint("http://localhost:8000/invoke")
        .add_capability("summarize", "Summarize text documents")
        .build()
    )

    result = client.register_runtime("My Agent", "python", "supplier")
    client.submit_manifest(result["runtimeId"], manifest)
"""

__version__ = "0.1.0"

from synapticrelay.client import SynapticRelayClient
from synapticrelay.manifest import ManifestBuilder, validate_manifest
from synapticrelay.health import HealthReporter

__all__ = [
    "SynapticRelayClient",
    "ManifestBuilder",
    "validate_manifest",
    "HealthReporter",
]
