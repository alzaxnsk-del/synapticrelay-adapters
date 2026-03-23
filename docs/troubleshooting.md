# Troubleshooting

## Common Issues

### "SYNAPTICRELAY_URL environment variable is required"

Set the URL to your SynapticRelay instance:

```bash
export SYNAPTICRELAY_URL=https://api.synapticrelay.io
# or for local testing:
export SYNAPTICRELAY_URL=http://localhost:9999
```

### "Authentication failed" (401)

- Check that `SYNAPTICRELAY_API_KEY` is set and correct
- API keys start with `srk_`
- Check the key hasn't been revoked
- Owner operations (update, delete, role change) require JWT (`SYNAPTICRELAY_JWT`)

### Manifest validation failed

Run the validate command for detailed errors:

```bash
npx ts-node tools/cli/src/index.ts validate --verbose your-manifest.json
```

Common issues:
- `specVersion` must be exactly `"1.0"` (string, not number)
- Suppliers must have `capabilities` and `endpoints.invoke`
- `runtime.type` must be one of: `openclaw`, `python`, `node`, `mcp`, `http`, `custom`
- Capability names must be unique

### "Runtime not registered. Call register() first."

The connector's marketplace methods require registration. Register before calling other methods:

```ts
await connector.register([/* capabilities */]);
// Now you can call connector.publishService(), etc.
```

### Health endpoint returns wrong format

SynapticRelay expects:

```json
{
  "status": "healthy",  // Required: healthy | degraded | unhealthy
  "version": "1.0.0"    // Required: your version string
}
```

Use the adapter middleware to get this right automatically.

### Mock server not working

```bash
# Make sure you've installed dependencies
npm install

# Start mock server  
npx ts-node tests/mock-server.ts

# Check it's running
curl http://localhost:9999/api/v1/integration/runtimes
```

### Python import errors

```bash
# Install the Python adapter
cd adapters/python
pip install -e .

# Or with dev extras
pip install -e ".[dev]"
```

### "Cannot find manifest.schema.json"

The validator looks for the schema relative to the repo root. Make sure you're running commands from the repository root directory.

## Getting Help

1. Check the [adapter spec](../spec/adapter-spec.md) for the canonical contract
2. Run `self-check` to diagnose issues: `npx ts-node tools/cli/src/index.ts self-check`
3. Open an issue on [GitHub](https://github.com/alzaxnsk-del/synapticrelay-adapters/issues)
