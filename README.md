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

## Contracts

| Contract | Address |
|----------|---------|
| TeachAgentPayment | `0x28f31060791aDEB994283Bc804E804F5ff26261C` |
| cUSD (Celo Mainnet, Mento) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| AgentRegistry (ERC-8004) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |

> **Note:** TeachAgent uses Mento's cUSD — not Circle USDC. They are different tokens.


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
