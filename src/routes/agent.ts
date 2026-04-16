import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { askCelo } from "../lib/groq"
import { provider, agentWallet, TEACH_AGENT_CONTRACT, TEACH_AGENT_ABI } from "../lib/celo"
import dotenv from "dotenv"
dotenv.config()

export const agentRouter = Router()

const PRICE_CELO = ethers.utils.parseEther("0.001")

async function verifyPayment(txHash: string, studentAddress: string) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt || receipt.status !== 1) {
      return { valid: false, error: "Transaction failed or not found" }
    }

    const topic = ethers.utils.id("QuestionPaid(address,uint256,uint256)")
    const iface = new ethers.utils.Interface(TEACH_AGENT_ABI)

    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === TEACH_AGENT_CONTRACT.toLowerCase() &&
        log.topics[0] === topic
      ) {
        try {
          const parsed = iface.parseLog(log)
          if (parsed.args.student.toLowerCase() === studentAddress.toLowerCase()) {
            return { valid: true, questionId: parsed.args.questionId.toString() }
          }
        } catch {}
      }
    }

    // Fallback: check direct CELO transfer to contract
    const tx = await provider.getTransaction(txHash)
    if (
      tx?.to?.toLowerCase() === TEACH_AGENT_CONTRACT.toLowerCase() &&
      tx.value.gte(PRICE_CELO) &&
      tx.from.toLowerCase() === studentAddress.toLowerCase()
    ) {
      return { valid: true, questionId: "direct" }
    }

    return { valid: false, error: "Payment not found in transaction" }
  } catch (err: any) {
    return { valid: false, error: err.message }
  }
}

// GET /agent/identity
agentRouter.get("/identity", (_req: Request, res: Response) => {
  res.json({
    name: "TeachAgent",
    version: "2.0.0",
    description: "Celo blockchain AI chatbot",
    agentAddress: agentWallet.address,
    contract: TEACH_AGENT_CONTRACT,
    network: "Celo Mainnet",
    chainId: 42220,
    price: "0.001 CELO per question",
  })
})

// POST /agent/session — pay 0.001 CELO, get answer
agentRouter.post("/session", async (req: Request, res: Response) => {
  const { question, txHash, studentAddress } = req.body

  if (!question?.trim()) {
    return res.status(400).json({ error: "question is required" })
  }

  // No payment — return 402 with instructions
  if (!txHash) {
    return res.status(402).json({
      error: "Payment required",
      message: "Call payForQuestion() on the contract with 0.001 CELO",
      contract: TEACH_AGENT_CONTRACT,
      network: "Celo Mainnet",
      chainId: 42220,
      price: "0.001",
      token: "CELO",
      abi: ["function payForQuestion() external payable returns (uint256 questionId)"],
    })
  }

  if (!studentAddress || !ethers.utils.isAddress(studentAddress)) {
    return res.status(400).json({ error: "Valid studentAddress required" })
  }

  try {
    const { valid, error: payErr } = await verifyPayment(txHash, studentAddress)
    if (!valid) {
      return res.status(402).json({ error: "Payment verification failed", reason: payErr })
    }

    const answer = await askCelo(question)
    res.json({
      question,
      answer,
      sessionAt: new Date().toISOString(),
      payment: { txHash, amount: "0.001 CELO", verified: true },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})