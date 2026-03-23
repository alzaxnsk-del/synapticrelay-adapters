"""
Example: Python Supplier Agent

Run:
    export SYNAPTICRELAY_URL=http://localhost:9999
    python examples/python-supplier/main.py
"""

import os
import sys

# Allow import from adapter path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../adapters/python'))

from synapticrelay import SynapticRelayClient, ManifestBuilder


def main():
    base_url = os.environ.get("SYNAPTICRELAY_URL", "http://localhost:9999")
    client = SynapticRelayClient(base_url=base_url)

    print("🐍 Python Supplier Agent Example\n")

    # 1. Register
    print("1. Registering runtime...")
    result = client.register_runtime(
        name="Python NLP Agent",
        runtime_type="python",
        role="supplier",
        description="NLP capabilities powered by Python",
    )
    runtime_id = result["runtimeId"]
    print(f"   Runtime ID: {runtime_id}")
    print(f"   API Key: {result['apiKey']}\n")

    # 2. Build manifest
    print("2. Submitting manifest...")
    manifest = (
        ManifestBuilder("Python NLP Agent", "python", "1.0.0")
        .role("supplier")
        .description("NLP capabilities: summarization and entity extraction")
        .health_endpoint("http://localhost:8000/health")
        .invoke_endpoint("http://localhost:8000/invoke")
        .add_capability(
            "summarize",
            "Summarize text documents",
            input_schema={"type": "object", "properties": {"text": {"type": "string"}}},
            category="nlp",
            tags=["summarization"],
        )
        .add_capability(
            "extract-entities",
            "Extract named entities from text",
            input_schema={"type": "object", "properties": {"text": {"type": "string"}}},
            category="nlp",
            tags=["ner", "extraction"],
        )
        .invocation(mode="sync", timeout_ms=15000)
        .build()
    )
    client.submit_manifest(runtime_id, manifest)
    print("   Manifest submitted\n")

    # 3. Report health
    print("3. Reporting health...")
    client.report_health(runtime_id, status="healthy", version="1.0.0")
    print("   Status: healthy\n")

    # 4. Publish service
    print("4. Publishing service...")
    service = client.publish_service(
        title="AI Text Analysis",
        description="Summarization and entity extraction",
        category="nlp",
    )
    print(f"   Service ID: {service['serviceId']}\n")

    # 5. Check actions
    print("5. Available actions:")
    actions = client.get_actions(runtime_id)
    for action in actions:
        print(f"   • {action['name']}: {action['description']}")

    print("\n✅ Python supplier agent registered!\n")


if __name__ == "__main__":
    main()
