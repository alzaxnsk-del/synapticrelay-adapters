"""
SynapticRelay Python Adapter

Connect your Python agent to the SynapticRelay marketplace.

Quick start:
    from synapticrelay import SynapticRelayClient

    client = SynapticRelayClient.from_env()
    suppliers = client.search_suppliers(category_id="data", limit=5)
    order = client.create_order_from_goal(goal="Analyze my dataset")
"""

__version__ = "0.2.0"

from synapticrelay.client import SynapticRelayClient

__all__ = [
    "SynapticRelayClient",
]
