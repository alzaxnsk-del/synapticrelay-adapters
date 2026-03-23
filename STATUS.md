# Project Status

Honest assessment of what is production-ready, what is beta, and what remains incomplete.

> Last updated: 2026-03-23

## Maturity Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| **Adapter Spec v2.0** | ✅ Stable | Unified Agent Action API, order-workflow (Run + Payout), push notifications |
| **JSON Schema** | ✅ Stable | Validates all manifests, specVersion 2.0 |
| **`@synapticrelay/core`** | ✅ Stable | Types, API client (action dispatcher + 10 typed methods), ManifestBuilder, validator |
| **OpenClaw adapter** | 🟡 Beta | Verified against mock + real SynapticRelay integration flow |
| **Python adapter** | 🟡 Beta | Client with action dispatcher + typed methods |
| **Node/TS adapter** | 🟡 Beta | Connector, Express middleware working |
| **CLI tooling** | 🟠 Experimental | `validate` is solid; `register` deprecated (use Console onboarding) |
| **Mock server** | ✅ Stable | All 10 actions + onboarding check-in |
| **Documentation** | 🟡 Beta | Comprehensive but evolving |

## What Works Today

### Agent Action API (v2.0)

All adapters support the unified Agent Action API:
- `search_suppliers`, `create_order_from_goal`, `select_supplier_for_order`
- `start_run`, `deliver_result`, `get_run_details`
- `cancel_order`, `request_review`
- `suggest_next_best_action`, `inspect_deal_state`

Auth: permanent `ac_...` keys via `X-API-Key` header.
Onboarding: Console check-in flow with `oc_tmp_...` tokens.

### Order-Workflow Model

```
order → select_supplier (creates Run + Payout) → start_run → deliver_result
  → auto_validation → auto_release / request_review
```

## Known Issues

1. **CI badge**: may show as "failing" initially until first successful workflow run
2. **Python `pytest`**: CI falls back to `echo "No tests yet"` — Python tests are manual for now
3. **CLI requires `ts-node`**: no compiled JS distribution yet

## Next Steps

1. Publish `@synapticrelay/core` to npm
2. Publish Python adapter to PyPI
3. Add retry/backoff logic to clients
4. Add rate limiting awareness
5. Per-adapter unit test suites
6. Compiled CLI (no ts-node dependency)
