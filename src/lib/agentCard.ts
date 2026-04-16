export const agentCard = {
  type: "agent",
  name: "TeachAgent",
  description: "AI agent that scores educators and provides tutoring sessions on Celo",
  image: "https://teachagent.vercel.app/logo.png",
  version: "1.0.0",
  endpoints: [
    {
      type: "rest",
      url: "https://teachagent-production.up.railway.app",
      description: "TeachAgent REST API"
    }
  ],
  capabilities: [
    "educator-scoring",
    "tutoring-sessions", 
    "reputation-tracking",
    "x402-payments"
  ],
  payment: {
    token: "cUSD",
    pricePerSession: "0.1",
    network: "celo"
  },
  identity: {
    standard: "ERC-8004",
    chain: 42220,
    registry: "0x8004A818BFB912233c491871b3d84c89A494BD9e"
  }
}