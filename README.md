# TeachAgent

> AI tutor for the Celo blockchain. Pay per question, onchain.

**Live:** https://teach-agent.vercel.app  
**API:** https://teachagent.onrender.com  
**Network:** Celo Mainnet (Chain ID 42220)

---

## What it does

TeachAgent answers any question about the Celo ecosystem — smart contracts, cUSD, MiniPay, wallets, DeFi, deployment — powered by Llama 3.3 70B via Groq.

- **0.001 CELO** per question (MetaMask, Valora)
- **0.001 cUSD** per question (MiniPay — automatic)
- Payment verified onchain before every answer
- Conversational memory persists across sessions (Upstash Redis)
- Live stats dashboard with leaderboard at `/stats`
- MiniPay auto-connect on load

---

## How to use

1. Open https://teach-agent.vercel.app
2. Connect your wallet — MetaMask, Valora, or open in MiniPay
3. Type a question and press **Send**
4. Confirm the payment in your wallet
5. Answer appears after on-chain confirmation

---

## API

### Ask a question (two-step)

```bash
# Step 1 — backend returns 402 with payment instructions
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{"question":"What is cUSD?","studentAddress":"0x..."}'

# Step 2 — after paying, re-call with txHash
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{"question":"What is cUSD?","studentAddress":"0x...","txHash":"0x..."}'
```

### Other endpoints

```bash
# Live on-chain stats
GET https://teachagent.onrender.com/agent/stats

# Agent identity + payment requirements
GET https://teachagent.onrender.com/agent/identity

# Health check
GET https://teachagent.onrender.com/agent/health
```

---

## Payment verification

The backend accepts two types of payment in `verifyPayment()`:

| Type | How | Token |
|------|-----|-------|
| Native CELO | `payForQuestion()` on contract | CELO |
| cUSD transfer (MiniPay) | `cUSD.transfer(contract, 0.001e18)` | cUSD |

MiniPay's CIP-64 transaction format silently drops the `value` field, so native CELO payments revert. The cUSD path is used automatically when MiniPay is detected.

---

## Contracts

| Contract | Address |
|----------|---------|
| TeachAgentPayment | `0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA` |
| cUSD (Celo Mainnet) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| AgentRegistry (ERC-8004) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |

---

## Local development

### Backend

```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # starts on port 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # starts on port 3000
```

### Environment variables (backend)

See `.env.example` — requires:
- `GROQ_API_KEY` — from console.groq.com
- `AGENT_PRIVATE_KEY` — wallet that owns the agent identity
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — from upstash.com (free tier)

---

## Architecture

```
User
 │
 ├── teach-agent.vercel.app (Next.js frontend)
 │     ├── Reown AppKit  → wallet connect (MetaMask / Valora / MiniPay)
 │     ├── ethers.js     → sign & submit payment tx on Celo
 │     └── fetch         → call backend with question + txHash
 │
 └── teachagent.onrender.com (Express backend)
       ├── POST /agent/session   → verify payment → ask Groq → return answer
       ├── GET  /agent/stats     → live on-chain metrics + leaderboard
       ├── GET  /agent/identity  → agent card (ERC-8004)
       ├── Upstash Redis         → conversation memory (7-day TTL)
       └── Celo Forno RPC        → read contract state + verify tx receipts
```
