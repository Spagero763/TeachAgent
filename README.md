# TeachAgent

> AI chatbot for the Celo blockchain. 0.001 CELO per question.

**Live:** https://teach-agent.vercel.app  
**API:** https://teachagent.onrender.com  
**Network:** Celo Mainnet

---

## What it does

TeachAgent answers any question about the Celo ecosystem — smart contracts, cUSD, MiniPay, wallets, DeFi, deployment — powered by Llama 3.3 70B.

Each question costs **0.001 CELO**, paid directly onchain via the TeachAgentPayment contract.

---

## How to use

1. Open the app at teach-agent.vercel.app
2. Click **Connect wallet** — MetaMask, Valora, or MiniPay
3. Type your question and press **Send**
4. Your wallet opens automatically — confirm 0.001 CELO payment
5. Answer appears instantly after confirmation

Works on mobile with MiniPay — payment triggers through the in-app browser automatically.

---

## API

### Ask a question
```bash
# Step 1 — will return 402 with payment info
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{"question":"What is cUSD?","studentAddress":"0x..."}'

# Step 2 — pay 0.001 CELO to contract, get txHash

# Step 3 — re-call with txHash
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{"question":"What is cUSD?","studentAddress":"0x...","txHash":"0x..."}'
```

---

## Contracts

| Contract | Address |
|---|---|
| TeachAgentPayment | `YOUR_DEPLOYED_ADDRESS` |
| AgentRegistry | `0xBe9Ddf20E2a0191232a5bf57003ea7A512851391` |