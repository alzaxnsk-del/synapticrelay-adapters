# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-03-23

### Added

- **Versioning policy** (`VERSIONING.md`) — explicit spec versioning, package versioning, and compatibility matrix
- **Project status** (`STATUS.md`) — honest maturity assessment of every component
- **Fast connect UX contract** (`docs/fast-connect.md`) — what "fast connect" means operationally
- **Real integration guide** (`docs/real-integration.md`) — how to connect to a live SynapticRelay instance
- **OpenClaw real-flow example** (`examples/openclaw-real-flow/`) — reproducible 5-step proof against real SynapticRelay
- **Integration smoke test** (`tests/integration-smoke.test.ts`) — starts mock server, runs registration flow, validates result
- **Python manifest validation test** (`adapters/python/tests/test_manifest.py`)

### Improved

- **README** — clearer opening for first-time visitors: who, what, why, and honest "fast connect" language
- **Quickstart** — two explicit paths (mock vs real), per-runtime collapsible guides, success checklists, common failures
- **Examples table** — distinguishes mock vs real targets
- **Documentation** — added 3 new guides to docs table, linked STATUS.md and VERSIONING.md
- **CI** — added integration smoke test job

### Changed

- Replaced vague "connect" language with concrete "fast connect" in all documentation

## [0.1.0] - 2026-03-23

### Added

- **Adapter Spec v1** — canonical public specification for connecting runtimes to SynapticRelay
  - Runtime manifest JSON Schema
  - Role model (supplier / buyer / both)
  - Invoke, status, and health contract definitions
  - Auth and configuration expectations
- **Core library** (`@synapticrelay/core`) — shared types, API client, manifest builder and validator
- **OpenClaw adapter** — first-class connector for OpenClaw agent runtimes
- **Python adapter** — pip-installable client for custom Python agents (FastAPI reference)
- **Node/TypeScript adapter** — npm package for Node agent runtimes (Express reference)
- **CLI tooling** — `validate`, `register`, `health-check`, `self-check` commands
- **Test harness** — mock SynapticRelay server for local validation
- **Examples** — supplier, buyer, both-role, OpenClaw, Python, and Node examples
- **Documentation** — quickstart, role model, manifest guide, auth guide, per-adapter guides, troubleshooting
- **CI** — GitHub Actions workflow with lint, typecheck, test
- **OSS** — Apache 2.0 license, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, issue templates
