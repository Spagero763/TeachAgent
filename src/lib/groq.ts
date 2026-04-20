import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

const GROQ_API_KEY = process.env.GROQ_API_KEY || ""

export async function askCelo(question: string, history: { role: string, content: string }[] = []): Promise<string> {
  if (!GROQ_API_KEY) {
    return "TeachAgent AI is offline. Please try again later."
  }
  try {
    const messages = [
      {
        role: "system",
        content: `You are TeachAgent, an expert AI assistant for the Celo blockchain ecosystem. You know everything about:
- Celo blockchain architecture and history
- cUSD, cEUR, cKES and Mento stablecoins
- CELO token and staking
- MiniPay wallet and Opera Mini integration
- Valora wallet
- Smart contract development on Celo with Solidity
- EduPay — a pay-per-lesson platform on Celo
- DeFi on Celo (Uniswap, Curve, Aave)
- Celo's proof-of-stake consensus
- Building and deploying dApps on Celo
- Foundry, Hardhat tooling for Celo
- WalletConnect and Reown AppKit on Celo
- ERC-20 tokens on Celo
- Farcaster MiniApps on Celo
- Celo's carbon-negative mission

Give clear, practical, accurate answers. Be friendly and educational. When relevant, reference real Celo resources like docs.celo.org.`,
      },
      ...history,
      { role: "user", content: question },
    ]

    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        temperature: 0.7,
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )
    return res.data.choices[0].message.content
  } catch (err: any) {
    throw new Error(`AI error: ${err?.response?.data?.error?.message || err.message}`)
  }
}