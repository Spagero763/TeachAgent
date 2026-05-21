# TeachAgent

> AI tutor for the Celo blockchain. Pay per question, onchain. **First question is free.**

**Live:** https://teach-agent.vercel.app  
**API:** https://teachagent.onrender.com  
**Network:** Celo Mainnet (Chain ID 42220)

---

## What it does

TeachAgent answers any question about the Celo ecosystem — smart contracts, cUSD, MiniPay, wallets, DeFi, staking, governance, and deployment — powered by Llama 3.3 70B via Groq.

- **First question free** — every new wallet gets one answer at no cost
- **0.001 CELO** per question after the free one (MetaMask, Valora, Coinbase Wallet)
- **0.001 cUSD** per question (MiniPay — automatic ERC-20 path)
- Payment verified onchain before every answer
- Conversational memory persists across sessions (Upstash Redis, 7-day TTL)
- Chat history loads automatically when you reconnect your wallet
- Live stats dashboard with leaderboard at `/stats`
- MiniPay auto-detect on page load
- Render keep-alive ping (no cold starts)
- Green-themed favicon and brand logo

---

## How to use

1. Open https://teach-agent.vercel.app
2. Connect your wallet — MetaMask, Valora, or open directly in MiniPay
3. Type a question and press **Send**
4. Your **first question is answered for free** — no payment needed
5. From the second question onward, confirm the payment in your wallet
6. Answer appears after on-chain confirmation (usually under 5 seconds)

---

## Payment flow

| Step | Non-MiniPay wallets | MiniPay |
|------|---------------------|---------|
| Free question | No tx required | No tx required |
| Paid question | `payForQuestion()` on contract with 0.001 CELO | `cUSD.transfer(contract, 0.001 cUSD)` ERC-20 |
| Backend verifies | CELO `QuestionPaid` event | cUSD `Transfer` event to contract |

MiniPay uses CIP-64 transactions which silently drop the native `value` field, so native CELO transfers revert. TeachAgent automatically switches to the cUSD ERC-20 path when MiniPay is detected (`window.ethereum.isMiniPay === true`).

---

## API

### Free first question (no txHash needed)

```bash
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{"question":"What is cUSD?","studentAddress":"0x..."}'
# Returns answer + freeQuestion: true on first call
# Returns 402 on subsequent calls without txHash
```

### Paid question

```bash
# After paying on-chain, re-call with txHash
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{"question":"How do I deploy on Celo?","studentAddress":"0x...","txHash":"0x..."}'
```

### Other endpoints

```bash
# Live on-chain stats + leaderboard
GET https://teachagent.onrender.com/agent/stats

# Agent identity + payment requirements
GET https://teachagent.onrender.com/agent/identity

# Conversation history for a wallet
GET https://teachagent.onrender.com/agent/history/:address

# Health check
GET https://teachagent.onrender.com/agent/health
```

---

## Contracts

| Contract | Address |
|----------|---------|
| TeachAgentPayment | `0x28f31060791aDEB994283Bc804E804F5ff26261C` |
| cUSD (Celo Mainnet, Mento) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| AgentRegistry (ERC-8004) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |

> **Note:** TeachAgent uses Mento's cUSD — not Circle USDC. They are different tokens.

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

| Variable | Description | Source |
|----------|-------------|--------|
| `GROQ_API_KEY` | LLM API key | console.groq.com |
| `AGENT_PRIVATE_KEY` | Wallet that signs agent identity | your wallet |
| `UPSTASH_REDIS_REST_URL` | Redis URL for memory + free-Q tracking | upstash.com (free) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | upstash.com |
| `RENDER_EXTERNAL_URL` | Auto-set by Render — enables keep-alive ping | auto |

---

## Architecture

```
User
 |
 +-- teach-agent.vercel.app (Next.js frontend)
 |     +-- Reown AppKit      -> wallet connect (MetaMask / Valora / MiniPay)
 |     +-- ethers.js         -> sign & submit payment tx on Celo
 |     +-- history loader    -> fetch /agent/history on wallet connect
 |     +-- free-Q banner     -> shows "first question free" until used
 |     +-- favicon           -> generated via Next.js ImageResponse
 |     `-- Framer Motion     -> chat animations + floating BG nodes
 |
 `-- teachagent.onrender.com (Express backend)
       +-- POST /agent/session   -> free-Q check -> verify payment -> Groq -> answer
       +-- GET  /agent/stats     -> live CELO + cUSD on-chain metrics + leaderboard
       +-- GET  /agent/history   -> stored conversation history per wallet
       +-- GET  /agent/identity  -> agent card (ERC-8004)
       +-- Upstash Redis         -> conversation memory + free-Q flags (7-day TTL)
       +-- Celo Forno RPC        -> read contract state + verify tx receipts
       `-- keep-alive ping       -> GET /health every 14 min (prevents cold starts)
```

---

## Knowledge base

The AI system prompt contains accurate, up-to-date Celo facts including:

- Celo network (Chain ID, RPC, block time, OP Stack L2 migration)
- All Mento stablecoins with mainnet addresses (cUSD, cEUR, cKES, cREAL)
- MiniPay architecture and CIP-64 transaction format
- DeFi protocols: Uniswap v3, Curve, Aave v3, Mento, Ubeswap
- Smart contract development (Hardhat, Foundry, Remix, Celo Composer)
- Staking, governance, and validator groups
- All key contract addresses on mainnet
- Testnet faucets and explorer links

---

## Built for Celo Proof of Ship