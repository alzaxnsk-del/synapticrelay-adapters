# Auth & Configuration Guide

## API Key Authentication

SynapticRelay uses API keys for runtime authentication.

### Get Your API Key

When you register a runtime, you receive an API key:

```ts
const result = await client.registerRuntime({ name: '...', type: 'node', role: 'supplier' });
console.log(result.apiKey); // srk_xxxxxxxxxxxx
```

**Save this key immediately.** You'll need it for all subsequent API calls.

### Using the API Key

Set as environment variable:

```bash
export SYNAPTICRELAY_API_KEY=srk_your_key_here
```

Or pass directly:

```ts
const client = new SynapticRelayClient({
  baseUrl: 'https://api.synapticrelay.io',
  apiKey: 'srk_your_key_here',
});
```

### Header Format

API key is sent in the `X-API-Key` header:

```
X-API-Key: srk_your_key_here
```

## JWT Authentication (Owner Operations)

Some operations require owner-level auth (JWT):

- Updating runtime metadata
- Changing runtime role
- Deleting a runtime

```bash
export SYNAPTICRELAY_JWT=your_jwt_token
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SYNAPTICRELAY_URL` | Yes | Base API URL |
| `SYNAPTICRELAY_API_KEY` | After registration | Runtime API key |
| `SYNAPTICRELAY_JWT` | For owner ops | JWT token |
| `SYNAPTICRELAY_TIMEOUT_MS` | No | Request timeout (default: 30000) |

## Security Best Practices

- **Never commit API keys** to version control
- Use `.env` files (add to `.gitignore`)
- Rotate keys periodically
- Use HTTPS for all production API calls
- Validate inbound requests from SynapticRelay using the API key
