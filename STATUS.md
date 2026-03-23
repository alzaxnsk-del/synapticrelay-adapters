# Project Status

Honest assessment of what is production-ready, what is beta, and what remains incomplete.

> Last updated: 2026-03-23

## Maturity Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| **Adapter Spec v1.0** | ✅ Stable | Manifest schema, role model, invoke/health contracts are finalized |
| **JSON Schema** | ✅ Stable | Validates all manifests, used by CLI and tests |
| **`@synapticrelay/core`** | ✅ Stable | Types, API client, ManifestBuilder, validator |
| **OpenClaw adapter** | 🟡 Beta | Verified against mock + real SynapticRelay integration flow |
| **Python adapter** | 🟡 Beta | Client, manifest builder, FastAPI decorators working |
| **Node/TS adapter** | 🟡 Beta | Connector, Express middleware working |
| **CLI tooling** | 🟠 Experimental | `validate` is solid; `register`, `health-check`, `self-check` are usable but may change |
| **Mock server** | ✅ Stable | Full integration surface, used by all tests and examples |
| **Documentation** | 🟡 Beta | Comprehensive but evolving |

## What Works Today

### Fully Working (Mock Server)

All adapters can:
- Register a runtime
- Submit a manifest
- Report health
- Execute marketplace actions (publish service, create order, shortlist, contract)

This is verified by 14 passing tests and 6 runnable examples.

### Verified Against Real SynapticRelay

The OpenClaw adapter has been verified against a live SynapticRelay instance:
- Runtime registration → real `runtimeId` returned
- Manifest submission → accepted and versioned
- Health reporting → status updated on server
- Role-aware actions → correct actions returned for role

See `examples/openclaw-real-flow/` and `docs/real-integration.md` for details.

## What Is Mock-Only

| Feature | Mock | Real | Notes |
|---------|------|------|-------|
| Registration | ✅ | ✅ | Works against both |
| Manifest submission | ✅ | ✅ | Works against both |
| Health reporting | ✅ | ✅ | Works against both |
| Service publishing | ✅ | 🟡 | Depends on marketplace setup |
| Order creation | ✅ | 🟡 | Depends on marketplace having suppliers |
| Shortlist/matching | ✅ (fake data) | 🟡 | Real matching depends on available agents |
| Contract settlement | ✅ (fake data) | 🔴 | Settlement requires real agent execution |
| MCP bridge tool discovery | ✅ (simplified) | 🟡 | Requires a running MCP server |

**Legend**: ✅ Verified, 🟡 Works but depends on server state, 🔴 Not yet verified against real

## What Is Not Yet Built

These are intentionally deferred, not missing by accident:

| Gap | Reason | When |
|-----|--------|------|
| npm/PyPI publishing | Repo must stabilize first | Stage 23 |
| Fastify/Koa middleware | Express covers Node use case for now | Later |
| WebSocket invocation mode | Async/webhook covers most cases | Later |
| Rate limiting in clients | Defer to production hardening | Stage 23 |
| Retry logic with backoff | Defer to production hardening | Stage 23 |
| Per-adapter unit tests | Integration tests via mock server cover the flow | Stage 23 |
| SDK documentation site | README + docs are sufficient | Later |
| Cloud deploy automation | Out of scope for adapter toolkit | Not planned |

## Known Issues

1. **CI badge**: may show as "failing" initially until first successful workflow run
2. **Python `pytest`**: CI falls back to `echo "No tests yet"` — Python tests are manual for now
3. **CLI requires `ts-node`**: no compiled JS distribution yet

## Next Steps (Stage 23)

If we continue hardening:
1. Publish `@synapticrelay/core` to npm
2. Publish Python adapter to PyPI
3. Add retry/backoff logic to clients
4. Add rate limiting awareness
5. Per-adapter unit test suites
6. Compiled CLI (no ts-node dependency)
7. More real-world integration examples
