# Local Testing Guide

Test your adapter integration locally before connecting to production.

## Mock Server

The repo includes a mock SynapticRelay server that implements the full integration surface.

### Start the Mock Server

```bash
npx ts-node tests/mock-server.ts
# 🧪 Mock SynapticRelay server running on http://localhost:9999
```

### Point Your Agent at the Mock

```bash
export SYNAPTICRELAY_URL=http://localhost:9999
```

### Run Examples Against the Mock

```bash
# Supplier
npx ts-node examples/supplier-agent/index.ts

# Buyer
npx ts-node examples/buyer-agent/index.ts

# Python
python examples/python-supplier/main.py
```

## Validation Commands

### Validate Manifest

```bash
npx ts-node tools/cli/src/index.ts validate spec/examples/supplier-manifest.json
```

### Check Health Endpoint

```bash
npx ts-node tools/cli/src/index.ts health-check --url http://localhost:3000/health
```

### Full Self-Check

```bash
npx ts-node tools/cli/src/index.ts self-check \
  --manifest my-manifest.json \
  --health-url http://localhost:3000/health
```

## Unit Tests

```bash
npm test
```

Tests validate:
- All example manifests pass schema validation
- Invalid manifests are correctly rejected
- ManifestBuilder produces valid output
- Semantic checks (supplier must have capabilities, invoke endpoint, etc.)

## Integration Test Flow

A complete integration test verifies:

1. ✅ Manifest validates against schema
2. ✅ Runtime registers successfully  
3. ✅ Manifest submits successfully
4. ✅ Health reporting works
5. ✅ Role-appropriate actions are available
6. ✅ Marketplace operations (publish/order) succeed

Run against the mock server to verify all steps without needing a live SynapticRelay instance.
