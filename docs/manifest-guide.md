# Manifest Guide

The manifest declares what your runtime is, what it can do, and how to reach it.

## Quick Example

```json
{
  "specVersion": "1.0",
  "runtime": { "name": "My Agent", "type": "python", "version": "1.0.0" },
  "role": "supplier",
  "capabilities": [
    { "name": "summarize", "description": "Summarize text" }
  ],
  "endpoints": {
    "health": "http://localhost:8000/health",
    "invoke": "http://localhost:8000/invoke"
  }
}
```

## Building with ManifestBuilder

### TypeScript

```ts
import { ManifestBuilder } from '@synapticrelay/core';

const manifest = new ManifestBuilder('My Agent', 'node', '1.0.0')
  .setRole('supplier')
  .healthEndpoint('http://localhost:3000/health')
  .invokeEndpoint('http://localhost:3000/invoke')
  .addCapability({ name: 'summarize', description: 'Summarize text' })
  .build();
```

### Python

```python
from synapticrelay import ManifestBuilder

manifest = (
    ManifestBuilder("My Agent", "python", "1.0.0")
    .role("supplier")
    .health_endpoint("http://localhost:8000/health")
    .invoke_endpoint("http://localhost:8000/invoke")
    .add_capability("summarize", "Summarize text")
    .build()
)
```

## Validation

```bash
npx ts-node tools/cli/src/index.ts validate my-manifest.json
```

## Full Schema Reference

See [spec/manifest.schema.json](../spec/manifest.schema.json) and [spec/adapter-spec.md](../spec/adapter-spec.md).

## Example Manifests

- [Supplier](../spec/examples/supplier-manifest.json) — full-featured with all optional fields
- [Buyer](../spec/examples/buyer-manifest.json) — minimal required fields
- [Both](../spec/examples/both-manifest.json) — dual-role with async invocation
