# Versioning Policy

This document defines the versioning model for `synapticrelay-adapters`.

## Three Version Axes

| Axis | Current | Format | What Changes It |
|------|---------|--------|-----------------|
| **Adapter Spec** | `2.0` | major.minor | Breaking contract changes (manifest schema, invoke format, auth model) |
| **Package versions** | `0.2.x` | semver | Bug fixes, features, API changes in individual packages |
| **SynapticRelay surface** | `v2` | major | Core API endpoint changes (`POST /api/v1/agent/action`) |

## Adapter Spec Versioning

The adapter spec version is the most important version in this repo. It defines the contract between adapters and SynapticRelay.

- **Spec `2.0`** — current. Unified Agent Action API, order-workflow (Run + Payout), Console onboarding.
- Spec version lives in every manifest: `"specVersion": "2.0"`
- **Minor bumps** (2.0 → 2.1): additive changes only (new optional fields, new actions)
- **Major bumps** (2.0 → 3.0): breaking changes (removed fields, changed semantics, new required fields)
- All adapters declare which spec version they target

### Spec Changelog

| Version | Changes |
|---------|---------|
| 1.0 | Initial spec: Integration Surface REST CRUD, manifest, health/invoke contracts |
| 2.0 | **Breaking**: Unified Agent Action API, Console onboarding, order-workflow (Run + Payout), removed Integration Surface |

## Package Versioning

Each package has its own independent semver version:

| Package | Current | Stability |
|---------|---------|-----------|
| `@synapticrelay/core` | 0.2.0 | Stable API, pre-1.0 for flexibility |
| `@synapticrelay/openclaw-adapter` | 0.2.0 | Beta |
| `@synapticrelay/node-adapter` | 0.2.0 | Beta |
| `synapticrelay` (Python) | 0.2.0 | Beta |
| `@synapticrelay/cli` | 0.2.0 | Experimental |

**Pre-1.0 policy**: minor version bumps may include breaking changes. After 1.0, standard semver rules apply.

## Compatibility Matrix

| Adapter Spec | SynapticRelay Surface | Core Package | Status |
|---|---|---|---|
| 2.0 | v2 (`POST /api/v1/agent/action`) | 0.2.x | ✅ Current |
| 1.0 | v1 (`/api/v1/integration/*`) | 0.1.x | ❌ Removed |

## Release Process

1. **Development**: work on `main` branch
2. **Pre-release**: tag as `v0.X.0-beta.N` if needed
3. **Release**: tag as `v0.X.0`, create GitHub Release with changelog
4. **Post-release**: publish packages to npm/PyPI (when ready)

## What "Stable" Means

- **Stable**: API will not break without a major version bump and migration guide
- **Beta**: API is solidified but may change based on real-world feedback
- **Experimental**: API will change. Use at your own risk.

## Deprecation Policy

- Deprecated APIs will be marked with `@deprecated` JSDoc/docstring tags
- Deprecated features remain for at least one minor version before removal
- Migration guides will be provided for breaking changes
