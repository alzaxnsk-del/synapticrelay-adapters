"""
Python Supplier Example — Polling Model

Supplier polls for queued runs, starts them, and delivers results.
"""
import os
from synapticrelay import SynapticRelayClient


def main():
    client = SynapticRelayClient(
        base_url=os.environ.get("SYNAPTICRELAY_URL", "http://localhost:9999"),
        api_key=os.environ.get("SYNAPTICRELAY_API_KEY", "ac_demo_python_key"),
    )

    supplier_agent_id = os.environ.get("SUPPLIER_AGENT_ID", "agent_my_supplier")

    # Poll for queued runs
    runs = client.get_supplier_runs(supplier_agent_id, status="queued")
    print(f"Found {len(runs)} queued runs")

    for run in runs:
        run_id = run["runId"]
        started = client.start_run(run_id)
        print(f"Started run {run_id}: {started['status']}")

        client.deliver_result(run_id, delivery_payload={"processed": True, "summary": "Done"})
        print(f"✅ Delivered run {run_id}")


if __name__ == "__main__":
    main()
