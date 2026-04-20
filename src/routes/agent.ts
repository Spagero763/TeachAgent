import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { askCelo } from "../lib/groq"
import { provider, agentWallet } from "../lib/celo"
import { getPaymentRequirements, verifyPayment } from "../lib/x402"
import dotenv from "dotenv"
dotenv.config()

export const agentRouter = Router()

// GET /agent/identity
agentRouter.get("/identity", (_req: Request, res: Response) => {
  res.json({
    name: "TeachAgent",
    version: "2.0.0",
    description: "Celo blockchain AI chatbot — 0.001 CELO per question",
    agentAddress: agentWallet.address,
    network: "Celo Mainnet",
    chainId: 42220,
    payment: getPaymentRequirements(),
  })
})

// Basic in-memory session store for conversational memory (resets on server restart)
const sessionMemory: Record<string, { role: string; content: string }[]> = {}

// Track used transaction hashes to prevent Replay Attacks
// A hash is only marked as used IF the AI successfully delivers an answer
const usedTxHashes = new Set<string>()

// POST /agent/session
agentRouter.post("/session", async (req: Request, res: Response) => {
  const { question, txHash, studentAddress } = req.body

  if (!question?.trim()) {
    return res.status(400).json({ error: "question is required" })
  }

  // No payment yet — return 402
  if (!txHash) {
    return res.status(402).json({
      error: "Payment required",
      message: "Call payForQuestion() on the TeachAgent contract with 0.001 CELO",
      ...getPaymentRequirements(),
    })
  }

  // Check if txHash has already been redeemed successfully
  if (usedTxHashes.has(txHash.toLowerCase())) {
    return res.status(400).json({
      error: "Transaction already used",
      message: "This payment txHash has already been consumed for a previous question.",
    })
  }

  if (!studentAddress || !ethers.utils.isAddress(studentAddress)) {
    return res.status(400).json({ error: "Valid studentAddress required" })
  }

  try {
    const { valid, payer, error: payErr } = await verifyPayment(txHash, studentAddress, provider)
    if (!valid) {
      return res.status(402).json({
        error: "Payment verification failed",
        reason: payErr,
        txHash,
        expectedContract: getPaymentRequirements().contract,
      })
    }

    // Load history for the address
    const history = sessionMemory[studentAddress.toLowerCase()] || []

    const answer = await askCelo(question.trim(), history)
    
    // Update history (keep last 6 messages to avoid token bloat)
    sessionMemory[studentAddress.toLowerCase()] = [
      ...history,
      { role: "user", content: question.trim() },
      { role: "assistant", content: answer }
    ].slice(-6)

    // Mark txHash as used ONLY after successful Groq generation
    usedTxHashes.add(txHash.toLowerCase())

    res.json({
      question: question.trim(),
      answer,
      sessionAt: new Date().toISOString(),
      payment: {
        txHash,
        payer: payer || studentAddress,
        amount: "0.001 CELO",
        verified: true,
        contract: getPaymentRequirements().contract,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /agent/health (alias)
agentRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})