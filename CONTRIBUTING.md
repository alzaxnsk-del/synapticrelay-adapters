# Contributing to synapticrelay-adapters

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/alzaxnsk-del/synapticrelay-adapters.git
cd synapticrelay-adapters
npm install
npm run typecheck
npm test
```

## Project Structure

| Directory | Description |
|-----------|-------------|
| `spec/` | Canonical adapter specification and JSON schemas |
| `packages/core/` | Shared TypeScript library (types, client, validator) |
| `adapters/openclaw/` | OpenClaw runtime adapter |
| `adapters/python/` | Python runtime adapter |
| `adapters/node/` | Node/TypeScript runtime adapter |
| `tools/cli/` | CLI tooling for manifest validation and registration |
| `tests/` | Test harness and integration tests |
| `examples/` | Runnable integration examples |
| `docs/` | Developer documentation |

## How to Contribute

### Adding a New Adapter

1. Create a new directory under `adapters/<runtime-name>/`
2. Implement the adapter against the spec in `spec/adapter-spec.md`
3. Include a `README.md` with setup, config, and usage instructions
4. Add an example under `examples/`
5. Add tests that validate manifest generation and registration flow
6. Update `docs/choosing-an-adapter.md`

### Modifying the Spec

1. Changes must be backward-compatible or clearly marked as breaking
2. Update `spec/manifest.schema.json` and `spec/adapter-spec.md` together
3. Run `npm run validate:examples` to ensure all examples still pass
4. Increment the spec version in the schema

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-adapter`)
3. Make your changes with tests
4. Run `npm run typecheck && npm run lint && npm test`
5. Submit a pull request

## Code Style

- TypeScript for all JS packages (strict mode)
- Python follows PEP 8
- Use Prettier for formatting (`npm run format`)
- Use ESLint for linting (`npm run lint`)

## Stability Labels

- **Stable**: Adapter spec, core types, manifest schema
- **Beta**: OpenClaw adapter, Python adapter, Node adapter
- **Experimental**: CLI tooling, test harness

## Questions?

Open a [Discussion](https://github.com/alzaxnsk-del/synapticrelay-adapters/discussions) or file an issue.
