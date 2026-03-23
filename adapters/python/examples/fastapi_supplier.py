"""
FastAPI reference integration: Supplier agent with SynapticRelay.

Run:
    pip install -e "adapters/python[dev]"
    export SYNAPTICRELAY_URL=http://localhost:9999
    uvicorn examples.fastapi_supplier:app --port 8000
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from synapticrelay import SynapticRelayClient, ManifestBuilder, HealthReporter
from synapticrelay.decorators import synapticrelay_health, synapticrelay_invoke


# ─── Capability Handlers ──────────────────────────────────────────────

async def handle_summarize(input_data: dict) -> dict:
    """Summarize text (stub — replace with real logic)."""
    text = input_data.get("text", "")
    return {
        "summary": f"Summary of {len(text)} characters: {text[:100]}...",
        "wordCount": len(text.split()),
    }


async def handle_translate(input_data: dict) -> dict:
    """Translate text (stub — replace with real logic)."""
    text = input_data.get("text", "")
    target = input_data.get("targetLang", "es")
    return {
        "translated": f"[{target}] {text}",
        "sourceLang": "en",
        "targetLang": target,
    }


# ─── App Setup ────────────────────────────────────────────────────────

CAPABILITIES = ["summarize", "translate"]
HANDLER_MAP = {
    "summarize": handle_summarize,
    "translate": handle_translate,
}

client: SynapticRelayClient | None = None
runtime_id: str | None = None
reporter: HealthReporter | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Register with SynapticRelay on startup."""
    global client, runtime_id, reporter

    sr_url = os.environ.get("SYNAPTICRELAY_URL", "http://localhost:9999")
    client = SynapticRelayClient(base_url=sr_url)

    # Build manifest
    manifest = (
        ManifestBuilder("Python Text Agent", "python", "1.0.0")
        .role("supplier")
        .description("Summarizes and translates text")
        .health_endpoint("http://localhost:8000/health")
        .invoke_endpoint("http://localhost:8000/invoke")
        .add_capability(
            "summarize",
            "Summarize text documents",
            input_schema={"type": "object", "properties": {"text": {"type": "string"}}},
        )
        .add_capability(
            "translate",
            "Translate text",
            input_schema={
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "targetLang": {"type": "string"},
                },
            },
        )
        .build()
    )

    # Register
    try:
        result = client.register_runtime(
            name="Python Text Agent",
            runtime_type="python",
            role="supplier",
            description="Summarizes and translates text",
        )
        runtime_id = result["runtimeId"]
        client.submit_manifest(runtime_id, manifest)

        # Start health reporting
        reporter = HealthReporter(client, runtime_id, version="1.0.0", capabilities=CAPABILITIES)
        reporter.start(interval_seconds=60)

        print(f"✅ Registered with SynapticRelay: {runtime_id}")
    except Exception as e:
        print(f"⚠️  SynapticRelay registration failed: {e}")
        print("   Agent will run in standalone mode")

    yield

    print("Shutting down...")


app = FastAPI(title="Python Supplier Agent", lifespan=lifespan)


@app.get("/health")
@synapticrelay_health(version="1.0.0", capabilities=CAPABILITIES)
async def health():
    """Health endpoint — SynapticRelay-compatible."""
    return {}


@app.post("/invoke")
@synapticrelay_invoke(handler_map=HANDLER_MAP)
async def invoke(request: Request):
    """Invoke endpoint — SynapticRelay-compatible."""
    pass
