# TeachAgent — Frontend

Next.js frontend for TeachAgent, the AI tutor on Celo blockchain.

**Live:** https://teach-agent.vercel.app

---

## Stack

- Next.js (App Router) with React
- Reown AppKit — wallet connection (MetaMask, Valora, MiniPay)
- ethers.js v5 — Celo transaction signing
- Framer Motion — animations
- Deployed on Vercel

---

## Local setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

---

## Environment

No required environment variables for local dev — the wallet project ID is bundled and the backend URL is hardcoded to the production API.

To point at a local backend, edit `AGENT_URL` in `src/app/page.tsx`:

```ts
const AGENT_URL = "http://localhost:3001"
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Chat UI — question input, payment flow, message thread |
| `src/app/stats/page.tsx` | Live stats dashboard — on-chain metrics + leaderboard |
| `src/components/Navbar.tsx` | Top navigation bar |
| `src/components/Logo.tsx` | SVG brand logo component |
| `src/app/providers.tsx` | Reown AppKit + wagmi setup |
| `src/lib/wagmi.ts` | Wagmi adapter config for Celo Mainnet |

---

## Payment flow

### Non-MiniPay wallets (MetaMask, Valora)
1. Frontend calls `POST /agent/session` — backend returns `402`
2. ethers.js calls `payForQuestion()` on the TeachAgentPayment contract with `0.001 CELO`
3. Frontend re-calls with `txHash` — backend verifies and returns answer

### MiniPay
MiniPay's CIP-64 transaction format silently drops the `value` field, causing native CELO transfers to arrive with `msg.value = 0`. Fix: MiniPay path sends **0.001 cUSD** to the contract using `cUSD.transfer()` instead. The backend accepts both payment types.

---

## Contracts

| | Address |
|---|---|
| TeachAgentPayment | `0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA` |
| cUSD (Celo Mainnet) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

Network: Celo Mainnet · Chain ID: 42220
