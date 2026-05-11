import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { askCelo } from "../lib/groq"
import { provider, agentWallet } from "../lib/celo"
import { getPaymentRequirements, verifyPayment } from "../lib/x402"
import { getHistory, saveHistory, isTxUsed, markTxUsed } from "../lib/memory"
import { TEACH_AGENT_CONTRACT } from "../lib/x402"
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

  if (!studentAddress || !ethers.utils.isAddress(studentAddress)) {
    return res.status(400).json({ error: "Valid studentAddress required" })
  }

  // Check if txHash has already been redeemed successfully
  if (await isTxUsed(txHash)) {
    return res.status(400).json({
      error: "Transaction already used",
      message: "This payment txHash has already been consumed for a previous question.",
    })
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

    const history = await getHistory(studentAddress)
    const answer = await askCelo(question.trim(), history)

    await saveHistory(studentAddress, [
      ...history,
      { role: "user", content: question.trim() },
      { role: "assistant", content: answer },
    ])

    // Mark txHash as used ONLY after successful Groq generation
    await markTxUsed(txHash)

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

// GET /agent/stats — live on-chain metrics for the stats dashboard
agentRouter.get("/stats", async (_req: Request, res: Response) => {
  // Step 1: read totalQuestions from contract
  let totalQuestions = 0
  try {
    const contract = new ethers.Contract(
      TEACH_AGENT_CONTRACT,
      ["function totalQuestions() view returns (uint256)"],
      provider
    )
    const raw: ethers.BigNumber = await contract.totalQuestions()
    totalQuestions = raw.toNumber()
  } catch (err: any) {
    console.error("[stats] totalQuestions failed:", err.message)
    return res.status(500).json({ error: `Contract read failed: ${err.message}` })
  }

  // Step 2: query events for unique users + leaderboard (non-fatal if RPC fails)
  let uniqueUsers = 0
  let leaderboard: { rank: number; address: string; questions: number }[] = []
  try {
    const contract = new ethers.Contract(
      TEACH_AGENT_CONTRACT,
      ["event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount)"],
      provider
    )
    const currentBlock = await provider.getBlockNumber()
    const FROM_BLOCK = Math.max(currentBlock - 500_000, 0)
    const filter = contract.filters.QuestionPaid()
    const events = await contract.queryFilter(filter, FROM_BLOCK, "latest")

    const userCounts: Record<string, number> = {}
    for (const ev of events) {
      const args = (ev as ethers.Event & { args: { student: string } }).args
      if (args?.student) {
        const addr = args.student.toLowerCase()
        userCounts[addr] = (userCounts[addr] || 0) + 1
      }
    }
    uniqueUsers = Object.keys(userCounts).length
    leaderboard = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([address, questions], i) => ({ rank: i + 1, address, questions }))
  } catch (err: any) {
    console.error("[stats] event query failed (non-fatal):", err.message)
  }

  res.json({
    totalQuestions,
    totalCELO: parseFloat((totalQuestions * 0.001).toFixed(4)),
    uniqueUsers,
    leaderboard,
    contract: TEACH_AGENT_CONTRACT,
    network: "Celo Mainnet",
    updatedAt: new Date().toISOString(),
  })
})

// GET /agent/health (alias)
agentRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})