export const agentCard = {
  type: "agent",
  name: "TeachAgent",
  description: "AI agent that answers questions about the Celo blockchain ecosystem",
  version: "2.0.0",
  endpoints: [
    {
      type: "rest",
      url: "https://teachagent.onrender.com",
      description: "TeachAgent REST API"
    }
  ],
  capabilities: [
    "celo-qa",
    "tutoring-sessions",
    "conversational-memory",
    "onchain-payments",
    "minipay-compatible",
    "learner-leaderboard",
    "realtime-stats-dashboard"
  ],
  payment: {
    token: "CELO",
    pricePerQuestion: "0.001",
    network: "celo",
    chainId: 42220,
    contract: "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA",
    method: "payForQuestion()"
  },
  identity: {
    standard: "ERC-8004",
    chain: 42220,
    agentId: 9099,
    agentUrl: "https://8004scan.io/agent/9099",
    identityRegistry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
  },
  developer: {
    name: "Afolabi Emmanuel (Spagero)",
    twitter: "@spagero71",
    github: "https://github.com/Spagero763/TeachAgent"
  }
}
