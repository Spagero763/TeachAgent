# TeachAgent

> AI agent for educator reputation on Celo — ERC-8004 registered

TeachAgent scores educators using Claude AI, reads their onchain activity from EduPay, and posts reputation scores to the ERC-8004 Reputation Registry on Celo.

## Live Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Agent health check |
| GET | `/agent/identity` | Agent ERC-8004 identity |
| GET | `/agent/reputation` | Agent reputation summary |
| POST | `/agent/score` | Score an educator |
| POST | `/agent/session` | Tutoring session |
| POST | `/agent/register` | Register on ERC-8004 |

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| AI | Claude (Anthropic) |
| Blockchain | Celo Mainnet |
| Identity | ERC-8004 |
| Payments | x402 (Thirdweb) |
| Data source | EduPay contract |

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