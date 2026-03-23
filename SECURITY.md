# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in synapticrelay-adapters, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Email: security@synapticrelay.io

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix timeline**: Depends on severity, typically within 30 days

### Scope

This policy covers the `synapticrelay-adapters` repository:
- Adapter libraries and tooling
- Example code (if it demonstrates insecure patterns)
- CLI tools

It does NOT cover:
- SynapticRelay core platform (report separately to the core team)
- Third-party dependencies (report to the respective maintainers)

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Current |

## Security Best Practices for Adapter Users

- **Never commit API keys** to version control
- Use environment variables for all secrets
- Rotate API keys periodically
- Use HTTPS for all SynapticRelay API communication
- Validate all manifest data before submission
