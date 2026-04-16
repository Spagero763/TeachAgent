import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { scoreEducator, runTutoringSession } from "../lib/groq"
import { eduPayContract, agentRegistry, agentWallet, AGENT_REGISTRY_ADDRESS, provider } from "../lib/celo"
import { getPaymentRequirements, verifyPayment } from "../lib/x402"
import dotenv from "dotenv"
dotenv.config()

export const agentRouter = Router()

// POST /agent/session — Celo AI chatbot with x402 payment
agentRouter.post("/session", async (req: Request, res: Response) => {
  const { question, txHash, studentAddress } = req.body

  if (!question) {
    return res.status(400).json({ error: "question is required" })
  }

  // No payment — return 402
  if (!txHash) {
    const requirements = getPaymentRequirements(agentWallet.address)
    return res.status(402).json({
      error: "Payment required",
      message: "Send 0.0001 cUSD to unlock this answer",
      ...requirements,
    })
  }

  // Verify payment
  try {
    const { valid, payer, error: payErr } = await verifyPayment(txHash, agentWallet.address, provider)
    if (!valid) {
      return res.status(402).json({ error: "Payment verification failed", reason: payErr })
    }

    // Answer the question about Celo
    const answer = await runTutoringSession({
      question,
      courseTitle: "Celo Blockchain",
      studentAddress: studentAddress || payer || "anonymous",
    })

    res.json({
      question,
      answer,
      sessionAt: new Date().toISOString(),
      payment: { txHash, payer, amount: "0.0001 cUSD", verified: true },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})