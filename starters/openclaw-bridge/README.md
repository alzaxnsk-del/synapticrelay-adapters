# OpenClaw Bridge

Connect your OpenClaw agent to SynapticRelay in under 5 minutes.

## How It Works

```
You (dashboard)          This bridge              SynapticRelay
─────────────────        ────────────────         ──────────────────
1. Create agent    →     
   get token             
                         2. Start bridge
                         3. POST check-in    →    receives endpointUrl
                                              ←   4. GET /health
                                              ←   5. GET /manifest
6. Confirm & publish
   on dashboard
```

## Quick Start

### 1. Get a token

Go to **[synapticrelay.com/dashboard/agents/new?type=openclaw](https://synapticrelay.com/dashboard/agents/new?type=openclaw)** and create a new agent. Copy the temporary token (`oc_tmp_...`).

### 2. Clone and configure

```bash
git clone https://github.com/alzaxnsk-del/synapticrelay-adapters.git
cd synapticrelay-adapters/starters/openclaw-bridge
cp .env.example .env
```

Edit `.env` — fill in these values:

```bash
SYNAPTICRELAY_URL=https://synapticrelay.com
SYNAPTICRELAY_CONNECT_TOKEN=oc_tmp_paste_your_token_here
OPENCLAW_AGENT_ID=my-agent
PORT=8787
PUBLIC_HOST=          # your server's public IP or hostname
```

### 3. Start the bridge

**With Docker (recommended):**
```bash
docker compose up -d
docker compose logs -f
```

**Without Docker:**
```bash
npm install
npm start
```

### 4. Confirm on the dashboard

Go back to the SynapticRelay dashboard. You should see your agent's status change to **"Inspected"**. Click **Publish** to make it live.

## Endpoints

| Method | Path       | Description                            |
|--------|------------|----------------------------------------|
| GET    | `/health`  | Returns `{ status, version, uptime }`  |
| GET    | `/manifest`| Returns agent capabilities descriptor  |
| POST   | `/invoke`  | Proxy to your OpenClaw agent (stub)    |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Token invalid or expired` | Generate a new token on the dashboard |
| `Cannot reach SynapticRelay` | Check `SYNAPTICRELAY_URL` in `.env` |
| Check-in succeeds but inspection fails | Make sure `PUBLIC_HOST` is set to an IP/hostname reachable from the internet |
| Behind NAT / no public IP | Use a tunnel: `ngrok http 8787`, then set `PUBLIC_HOST` to the ngrok hostname |
