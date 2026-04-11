# TeachAgent

> AI agent for educator reputation on Celo — ERC-8004 registered

TeachAgent scores educators using Claude AI, reads their onchain activity from EduPay, and posts reputation scores to the ERC-8004 Reputation Registry on Celo.

## How to Use TeachAgent

### Score an educator
```bash
curl -X POST https://teachagent.onrender.com/agent/score \
  -H "Content-Type: application/json" \
  -d '{"tutorAddress": "0x..."}'
```

### Ask a question (with payment)

**Step 1** — Call without txHash to get payment requirements:
```bash
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{"question": "What is a smart contract?", "courseTitle": "Blockchain 101"}'
# Returns 402 with payTo address
```

**Step 2** — Send 0.001 cUSD to the agent wallet on Celo

**Step 3** — Re-call with txHash:
```bash
curl -X POST https://teachagent.onrender.com/agent/session \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is a smart contract?",
    "courseTitle": "Blockchain 101",
    "txHash": "0x..."
  }'
```

### MiniPay compatible
TeachAgent accepts cUSD payments from MiniPay on Celo. Open MiniPay → send 0.001 cUSD to `[agent wallet address]` → use the tx hash.

## Live Endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Agent status |
| `GET /agent/identity` | Agent ERC-8004 identity |
| `GET /agent/reputation` | Onchain reputation score |
| `POST /agent/score` | Score an educator (free) |
| `POST /agent/session` | Tutoring session (0.001 cUSD) |
| `POST /agent/register` | Register on AgentRegistry |


## ERC-8004 Identity

- Identity Registry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Reputation Registry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- Network: Celo Mainnet (Chain 42220)

## EduPay Integration

Reads live data from EduPay contract:
`0xDBA56f8d23c69Dbd9659be4ca18133962BC86191`

## Score an Educator
```bash
curl -X POST https://teachagent-production.up.railway.app/agent/score \
  -H "Content-Type: application/json" \
  -d '{"tutorAddress": "0x..."}'
```