"""
Python Supplier Example — SynapticRelay Agent Action API

Demonstrates how a Python supplier interacts with the platform
using the unified action API.
"""

import os
from synapticrelay import SynapticRelayClient


def main():
    client = SynapticRelayClient(
        base_url=os.environ.get("SYNAPTICRELAY_URL", "http://localhost:9999"),
        api_key=os.environ.get("SYNAPTICRELAY_API_KEY", "ac_demo_python_key"),
    )

    # Check platform suggestion
    suggestion = client.suggest_next_best_action()
    print("Suggestion:", suggestion)

    # If we have a contract to fulfill
    contract_id = os.environ.get("CONTRACT_ID")
    if contract_id:
        state = client.inspect_contract_state(contract_id)
        print("Contract state:", state)

        client.submit_result(contract_id, {"processed": True, "summary": "Done"})
        print("✅ Result submitted")


if __name__ == "__main__":
    main()
