# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **OSS** — Apache 2.0 license, CONTRIBUTING, SECURITY, issue templates
