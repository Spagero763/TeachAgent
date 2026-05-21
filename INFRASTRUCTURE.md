# TeachAgent Infrastructure

TeachAgent is not just an app — it is **infrastructure for the Celo agent economy**. Other builders and autonomous agents can integrate verified Celo knowledge into their own products through several channels:

1. **SDK** — `teachagent-sdk` npm package
2. **Embeddable Widget** — one-line `<script>` for any website
3. **Agent-to-Agent (A2A) endpoint** — for autonomous agents
4. **REST API** — direct HTTP access

All channels share the same verified Celo knowledge base and the same onchain payment model: **the first query per address is free; each subsequent answer costs 0.001 CELO** (or 0.001 cUSD via MiniPay), verified onchain before the answer is returned.

- Live app: https://teach-agent.vercel.app
- Agent card: https://teachagent.onrender.com/.well-known/agent-card.json
- ERC-8004 Agent: #9099 — https://8004scan.io/agents/celo/9099

---

## 1. SDK — teachagent-sdk

Add Celo Q&A to any TypeScript/JavaScript app or agent.

```bash
npm install teachagent-sdk
```

```ts
import { TeachAgent, PaymentRequiredError } from "teachagent-sdk"

const ta = new TeachAgent({ address: "0xYourWalletOrAgent" })

// First question per address is free
const { answer, free } = await ta.ask("What is cUSD and its address?")

// Paid path
try {
  await ta.ask("How do I stake CELO?")
} catch (e) {
  if (e instanceof PaymentRequiredError) {
    // pay e.requirements.price CELO to e.requirements.contract, then:
    await ta.ask("How do I stake CELO?", { txHash: "0x..." })
  }
}

// Other helpers
await ta.stats()       // live onchain metrics
await ta.identity()    // ERC-8004 identity + payment info
await ta.history()     // stored conversation history
```

Source: ./sdk

---

## 2. Embeddable Widget

Drop verified Celo Q&A into any website with one line:

```html
<script src="https://teach-agent.vercel.app/widget.js"></script>
```

Optional config (set BEFORE the script tag):

```html
<script>
  window.TeachAgentConfig = {
    position: "bottom-right",
    color: "#35D07F",
    label: "Ask about Celo"
  }
</script>
<script src="https://teach-agent.vercel.app/widget.js"></script>
```

A floating launcher appears in the corner; clicking it opens the live TeachAgent
assistant. Wallet connection, the free first question, and onchain payments all
work inside the panel.

Live demo: https://teach-agent.vercel.app/widget-demo.html

---

## 3. Agent-to-Agent (A2A)

For autonomous agents that need verified Celo knowledge. Follows an A2A-style
message envelope and the x402 payment flow.

Discover the skill:

```bash
GET https://teachagent.onrender.com/agent/a2a
```

Query (free first time per agent address):

```bash
curl -X POST https://teachagent.onrender.com/agent/a2a \
  -H "Content-Type: application/json" \
  -d "{ \"message\": { \"role\": \"user\", \"parts\": [{ \"type\": \"text\", \"text\": \"Explain Celo L2 migration\" }] }, \"agentAddress\": \"0xCallingAgent\" }"
```

After payment, resend with txHash. When payment is required the endpoint returns
HTTP 402 with machine-readable x402 payment requirements.

---

## 4. REST API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /agent/session | Ask a question (free first, then paid) |
| GET  | /agent/a2a | A2A skill descriptor |
| POST | /agent/a2a | Agent-to-agent query |
| GET  | /agent/stats | Live onchain metrics + leaderboard |
| GET  | /agent/identity | Agent card (ERC-8004 + payment) |
| GET  | /agent/history/:address | Conversation history per address |
| GET  | /agent/health | Health check |

Base URL: https://teachagent.onrender.com

---

## Payment model (all channels)

| | Detail |
|---|---|
| Free tier | First query per address |
| Price | 0.001 CELO (or 0.001 cUSD via MiniPay) |
| Contract | 0x28f31060791aDEB994283Bc804E804F5ff26261C |
| Method | payForQuestion() (CELO) or cUSD transfer() |
| Network | Celo Mainnet (chainId 42220) |
| Standard | x402 (HTTP 402 Payment Required) |

---

Built by Afolabi Emmanuel (Spagero) — https://x.com/spagero71