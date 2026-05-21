# TeachAgent — Frontend

Next.js frontend for TeachAgent, the pay-per-question AI tutor on Celo blockchain.

**Live:** https://teach-agent.vercel.app

---

## Stack

- Next.js (App Router) with React 19
- Reown AppKit — wallet connection (MetaMask, Valora, Coinbase Wallet, MiniPay)
- ethers.js v5 — Celo transaction signing and receipt verification
- Framer Motion — chat animations and floating background nodes
- Deployed on Vercel

---

## Local setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

No required environment variables for local dev — the wallet project ID is bundled and the backend URL points to the production API.

To point at a local backend, edit `AGENT_URL` in `src/app/page.tsx`:

```ts
const AGENT_URL = "http://localhost:3001"
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main chat UI — question input, payment flow, message thread, history loader |
| `src/app/stats/page.tsx` | Live stats dashboard — CELO + cUSD metrics, leaderboard |
| `src/app/layout.tsx` | Root layout — metadata, OG tags, fonts, theme color |
| `src/app/icon.tsx` | Favicon — generated via Next.js ImageResponse (32x32) |
| `src/app/apple-icon.tsx` | iOS home screen icon (180x180) |
| `src/app/providers.tsx` | Reown AppKit + wagmi setup, light theme, green accent |
| `src/components/Navbar.tsx` | Top navigation bar with logo |
| `src/components/Logo.tsx` | SVG brand logo — green gradient, Celo hexagon, T lettermark |
| `src/lib/wagmi.ts` | Wagmi adapter config for Celo Mainnet |

---

## Features

### First question free

Every new wallet address gets one question answered without payment. The frontend:
- Detects `freeUsed` state from `GET /agent/history/:address` on wallet connect
- Shows a green "First question is FREE" banner until the free question is used
- Marks the free answer in the chat thread with a "FREE" badge
- After the free question, the normal payment flow begins

### Chat history

When a wallet connects (or MiniPay is detected), the frontend fetches stored conversation history from `GET /agent/history/:address` and pre-populates the chat thread. Prior messages are shown with a subtle "from history" style so users can continue where they left off.

### MiniPay auto-connect

On page load, if `window.ethereum?.isMiniPay === true`, the app reads the connected address and skips the wallet connect modal entirely.

---

## Payment flow

### Non-MiniPay wallets (MetaMask, Valora, Coinbase Wallet)

1. First question: no payment — backend returns answer with `freeQuestion: true`
2. From second question: frontend calls `payForQuestion()` on the TeachAgentPayment contract with `0.001 CELO`
3. Frontend re-calls `POST /agent/session` with `txHash` — backend verifies on-chain and returns answer

### MiniPay

MiniPay uses CIP-64 transaction format, which silently drops the native `value` field. Sending CELO via `eth_sendTransaction` with a `value` field will cause the contract to revert with "Pay at least 0.001 CELO".

**Fix:** When `window.ethereum.isMiniPay === true`, the frontend sends **0.001 cUSD** to the contract using an ERC-20 `transfer()` call instead:

```ts
const cUSDIface = new ethers.utils.Interface(["function transfer(address,uint256) returns (bool)"])
const data = cUSDIface.encodeFunctionData("transfer", [TEACH_AGENT_CONTRACT, PAYMENT_VALUE])
await eth.request({
  method: "eth_sendTransaction",
  params: [{ from: signerAddr, to: CUSD_ADDRESS, data, gas: ethers.utils.hexlify(100000) }],
})
```

The backend verifies this as a valid cUSD payment by checking `Transfer` events on the cUSD contract.

---

## Contracts

| | Address |
|---|---|
| TeachAgentPayment | `0x28f31060791aDEB994283Bc804E804F5ff26261C` |
| cUSD (Mento, Celo Mainnet) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

Network: Celo Mainnet · Chain ID: 42220  
RPC: https://forno.celo.org · Explorer: https://celoscan.io