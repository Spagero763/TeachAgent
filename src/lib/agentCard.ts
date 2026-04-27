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
    "educator-scoring",
    "tutoring-sessions",
    "reputation-tracking"
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
    registry: "0x8004A818BFB912233c491871b3d84c89A494BD9e"
  }
}
