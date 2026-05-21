# teachagent-sdk

Add verified Celo blockchain Q&A to any app or agent in a few lines.

[TeachAgent](https://teach-agent.vercel.app) is a pay-per-question AI tutor on Celo — grounded in a verified, regularly-updated Celo knowledge base (real contract addresses, RPCs, protocols, docs). It never hallucinates fake addresses. Registered as ERC-8004 Agent **#9099** on Celo Mainnet.

## Install

```bash
npm install teachagent-sdk
```

## Quick start

```ts
import { TeachAgent } from "teachagent-sdk"

const ta = new TeachAgent({ address: "0xYourWalletOrAgentAddress" })

// First question per address is FREE
const { answer, free } = await ta.ask("What is cUSD and its contract address?")
console.log(answer)        // verified, sourced Celo answer
console.log(free)          // true on the first call
```

## Pricing

- **First question per address: free**
- After that: **0.001 CELO** per answer (or 0.001 cUSD via MiniPay), verified onchain.

When payment is required, `ask()` throws `PaymentRequiredError` with the payment details:

```ts
import { TeachAgent, PaymentRequiredError } from "teachagent-sdk"

try {
  const { answer } = await ta.ask("How do I stake CELO?")
} catch (e) {
  if (e instanceof PaymentRequiredError) {
    // pay e.requirements.price CELO to e.requirements.contract via payForQuestion()
    // then retry with the txHash:
    const { answer } = await ta.ask("How do I stake CELO?", { txHash: "0x..." })
  }
}
```

## Agent-to-agent (A2A)

For autonomous agents querying TeachAgent's knowledge:

```ts
const { answer } = await ta.a2a("Explain Celo's OP Stack L2 migration", {
  address: "0xCallingAgentAddress",
})
```

## Other methods

```ts
await ta.stats()      // live onchain usage metrics + leaderboard
await ta.identity()   // ERC-8004 identity + payment info
await ta.history()    // stored conversation history for the address
```

## Links

- App: https://teach-agent.vercel.app
- Agent card: https://teachagent.onrender.com/.well-known/agent-card.json
- 8004scan: https://8004scan.io/agents/celo/9099
- GitHub: https://github.com/Spagero763/TeachAgent

## License

MIT — built by Afolabi Emmanuel (Spagero).
