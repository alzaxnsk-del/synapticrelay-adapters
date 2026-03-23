"""
Python Supplier Example — SynapticRelay Order-Workflow

Flow: start_run → deliver_result
"""

import os
from synapticrelay import SynapticRelayClient


def main():
    client = SynapticRelayClient(
        base_url=os.environ.get("SYNAPTICRELAY_URL", "http://localhost:9999"),
        api_key=os.environ.get("SYNAPTICRELAY_API_KEY", "ac_demo_python_key"),
    )

    suggestion = client.suggest_next_best_action()
    print("Suggestion:", suggestion)

    run_id = os.environ.get("RUN_ID")
    if run_id:
        run = client.start_run(run_id)
        print("Run started:", run)

        client.deliver_result(run_id, delivery_payload={"processed": True, "summary": "Done"})
        print("✅ Result delivered")

        details = client.get_run_details(run_id)
        print("Run details:", details)


if __name__ == "__main__":
    main()
