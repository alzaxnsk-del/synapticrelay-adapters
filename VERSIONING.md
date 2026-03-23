# Versioning Policy

This document defines the versioning model for `synapticrelay-adapters`.

## Three Version Axes

| Axis | Current | Format | What Changes It |
|------|---------|--------|-----------------|
| **Adapter Spec** | `1.0` | major.minor | Breaking contract changes (manifest schema, invoke format, auth model) |
| **Package versions** | `0.1.x` | semver | Bug fixes, features, API changes in individual packages |
| **SynapticRelay surface** | `v1` | major | Core API endpoint changes (`/api/v1/integration/*`) |

## Adapter Spec Versioning

The adapter spec version is the most important version in this repo. It defines the contract between adapters and SynapticRelay.

- **Spec `1.0`** — current. Stable. No breaking changes planned.
- Spec version lives in every manifest: `"specVersion": "1.0"`
- **Minor bumps** (1.0 → 1.1): additive changes only (new optional fields, new runtime types)
- **Major bumps** (1.0 → 2.0): breaking changes (removed fields, changed semantics, new required fields)
- All adapters declare which spec version they target

## Package Versioning

Each package has its own independent semver version:

| Package | Current | Stability |
|---------|---------|-----------|
| `@synapticrelay/core` | 0.1.0 | Stable API, pre-1.0 for flexibility |
| `@synapticrelay/openclaw-adapter` | 0.1.0 | Beta |
| `@synapticrelay/node-adapter` | 0.1.0 | Beta |
| `synapticrelay` (Python) | 0.1.0 | Beta |
| `@synapticrelay/cli` | 0.1.0 | Experimental |

**Pre-1.0 policy**: minor version bumps may include breaking changes. After 1.0, standard semver rules apply.

## Compatibility Matrix

| Adapter Spec | SynapticRelay Surface | Core Package | Status |
|---|---|---|---|
| 1.0 | v1 (`/api/v1/integration/*`) | 0.1.x | ✅ Current |

When SynapticRelay introduces surface v2, adapters will need a new spec version or a compatibility layer.

## Release Process

1. **Development**: work on `main` branch
2. **Pre-release**: tag as `v0.X.0-beta.N` if needed
3. **Release**: tag as `v0.X.0`, create GitHub Release with changelog
4. **Post-release**: publish packages to npm/PyPI (when ready)

### GitHub Releases

- Each release gets a GitHub Release with a tag matching the version
- Release notes follow the format in CHANGELOG.md
- Binary artifacts: none (source-only project)

## What "Stable" Means

- **Stable**: API will not break without a major version bump and migration guide
- **Beta**: API is solidified but may change based on real-world feedback
- **Experimental**: API will change. Use at your own risk.

## Deprecation Policy

- Deprecated APIs will be marked with `@deprecated` JSDoc/docstring tags
- Deprecated features remain for at least one minor version before removal
- Migration guides will be provided for breaking changes
