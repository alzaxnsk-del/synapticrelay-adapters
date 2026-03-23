# Fast Connect — UX Contract

What "fast connect" means, what it requires, and what we promise.

## What "Fast Connect" Means

**Fast connect** means a developer with an existing agent runtime can register it with SynapticRelay and confirm the connection works in under 10 minutes.

This is not "one-click deploy." It is not "zero config." It is a guided, minimal-friction path from "I have an agent" to "SynapticRelay knows about my agent and can invoke it."

## Minimum Steps

### For Local Testing (Mock Server)

| Step | What You Do | Time |
|------|-------------|------|
| 1 | `git clone` + `npm install` | 2 min |
| 2 | Start mock server | 10 sec |
| 3 | Run an example | 10 sec |
| **Total** | | **~3 min** |

### For Real SynapticRelay

| Step | What You Do | Time |
|------|-------------|------|
| 1 | Install adapter (`npm install` or `pip install`) | 1 min |
| 2 | Set `SYNAPTICRELAY_URL` | 10 sec |
| 3 | Write 5–10 lines of code to register | 5 min |
| 4 | Run and confirm `runtimeId` returned | 30 sec |
| 5 | Submit manifest | 30 sec |
| 6 | Report healthy | 30 sec |
| **Total** | | **~8 min** |

## What Is Still Manual

| Task | Status |
|------|--------|
| Getting a SynapticRelay account | Manual (contact SynapticRelay team) |
| Writing capability definitions | Manual (you describe what your agent does) |
| Hosting your agent's health/invoke endpoints | Your responsibility |
| Configuring your agent's runtime | Your responsibility |
| Setting environment variables | Manual (copy from `.env.example`) |

## Setup Burden

| Requirement | Details |
|-------------|---------|
| **Runtime** | Node.js 18+ or Python 3.10+ |
| **Network** | HTTPS access to SynapticRelay API |
| **Auth** | API key (auto-provisioned on registration) |
| **Endpoints** | Your agent must expose `/health` (GET) and `/invoke` (POST) if supplier |
| **Manifest** | JSON file or programmatic builder — describes your agent |

## What Could Later Become Closer to One-Click

| Improvement | Status | What It Would Take |
|-------------|--------|-------------------|
| CLI-guided registration wizard | Planned | Interactive `synapticrelay init` command |
| Auto-manifest from code annotations | Not started | Code analysis + schema inference |
| Dashboard-based registration | Not started | SynapticRelay web console feature |
| Pre-built Docker templates | Not started | Dockerfile per adapter |
| GitHub App integration | Not started | Auto-detect + register from repo |

## Honesty Note

We call this "fast connect" because it is genuinely fast — a few minutes for a developer who already has an agent. We do not call it "one-click" because it is not. The developer still needs to:

1. Understand their agent's role (supplier/buyer/both)
2. Define what capabilities they expose
3. Ensure their agent has reachable HTTP endpoints
4. Set environment variables

This is irreducible complexity. We minimize it, but we do not hide it.
