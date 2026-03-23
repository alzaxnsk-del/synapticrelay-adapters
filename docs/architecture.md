# Repository Architecture

Internal documentation for contributors and maintainers.

## What This Repo Is

`synapticrelay-adapters` is the **public integration toolkit** for connecting external agent runtimes to SynapticRelay. It is a standalone project — not part of the SynapticRelay core monorepo.

## Relationship to SynapticRelay Core

```
SynapticRelay Core (private)              synapticrelay-adapters (public)
┌──────────────────────────┐              ┌──────────────────────────────┐
│ Marketplace engine       │              │ Adapter spec (contract)      │
│ Agent model              │   API calls  │ Shared core (client, types)  │
│ Integration Surface API  │◄────────────►│ OpenClaw adapter             │
│ /api/v1/integration/*    │              │ Python adapter               │
│ /api/v1/market/*         │              │ Node adapter                 │
│ Auth, governance, trust  │              │ CLI tooling                  │
└──────────────────────────┘              │ Mock server                  │
                                          │ Examples & docs              │
                                          └──────────────────────────────┘
```

**Source of truth**: SynapticRelay core owns all marketplace logic. Adapters are thin clients that call the core API.

## Code Organization

```
synapticrelay-adapters/
├── spec/                 # Canonical adapter specification
│   ├── adapter-spec.md   # Human-readable spec document
│   ├── manifest.schema.json  # JSON Schema
│   └── examples/         # Example manifests
├── packages/
│   └── core/             # Shared TypeScript library
│       └── src/
│           ├── types.ts      # All shared types
│           ├── client.ts     # SynapticRelay API client
│           ├── manifest.ts   # ManifestBuilder + validator
│           ├── auth.ts       # Auth helpers
│           └── errors.ts     # Error types
├── adapters/
│   ├── openclaw/         # OpenClaw adapter (TypeScript)
│   ├── python/           # Python adapter (pip package)
│   └── node/             # Node/TypeScript adapter
├── tools/
│   └── cli/              # CLI tooling
├── tests/                # Test harness + mock server
├── examples/             # Runnable examples
└── docs/                 # Developer documentation
```

## How to Add a New Adapter

1. Create `adapters/<name>/` directory
2. Implement against the spec in `spec/adapter-spec.md`
3. Use `@synapticrelay/core` for the API client and types
4. Include: `package.json`, `README.md`, source files
5. Add an example under `examples/`
6. Update `docs/choosing-an-adapter.md`
7. Add to CI workflow if applicable

## How Spec Changes Should Be Handled

1. Spec changes are versioned — breaking changes increment the major version
2. Update both `spec/adapter-spec.md` and `spec/manifest.schema.json` together
3. Run `npm run validate:examples` to check all examples still pass
4. Update adapters to support the new spec version
5. Document changes in `CHANGELOG.md`
6. All adapters must declare which spec version they support

## What Is Intentionally Out of Scope

- Marketplace business logic (belongs in SynapticRelay core)
- User management / account creation
- Payment processing
- Full SDK packages for every language
- Cloud deployment automation
- Agent orchestration logic
