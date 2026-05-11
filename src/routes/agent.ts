import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { askCelo } from "../lib/groq"
import { provider, agentWallet } from "../lib/celo"
import { getPaymentRequirements, verifyPayment } from "../lib/x402"
import { getHistory, saveHistory, isTxUsed, markTxUsed, isFreeUsed, markFreeUsed } from "../lib/memory"
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

  // No payment yet — check if wallet qualifies for free first question
  if (!txHash) {
    if (!studentAddress || !ethers.utils.isAddress(studentAddress)) {
      return res.status(400).json({ error: "Valid studentAddress required" })
    }
    const freeUsed = await isFreeUsed(studentAddress)
    if (!freeUsed) {
      // Answer the first question for free
      const history = await getHistory(studentAddress)
      const answer = await askCelo(question.trim(), history)
      await saveHistory(studentAddress, [
        ...history,
        { role: "user", content: question.trim() },
        { role: "assistant", content: answer },
      ])
      await markFreeUsed(studentAddress)
      return res.json({
        question: question.trim(),
        answer,
        sessionAt: new Date().toISOString(),
        freeQuestion: true,
      })
    }
    return res.status(402).json({
      error: "Payment required",
      message: "Call payForQuestion() on the TeachAgent contract with 0.001 CELO",
      ...getPaymentRequirements(),
    })
  }

  if (!studentAddress || !ethers.utils.isAddress(studentAddress)) {
    return res.status(400).json({ error: "Valid studentAddress required" })
  }

  // Check if txHash has already been redeemed
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
const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"
const PRICE_CUSD = ethers.utils.parseEther("0.001")

agentRouter.get("/stats", async (_req: Request, res: Response) => {
  // Step 1: read totalQuestions from contract (native CELO payments only)
  let celoQuestions = 0
  try {
    const contract = new ethers.Contract(
      TEACH_AGENT_CONTRACT,
      ["function totalQuestions() view returns (uint256)"],
      provider
    )
    const raw: ethers.BigNumber = await contract.totalQuestions()
    celoQuestions = raw.toNumber()
  } catch (err: any) {
    console.error("[stats] totalQuestions failed:", err.message)
    return res.status(500).json({ error: `Contract read failed: ${err.message}` })
  }

  const userCounts: Record<string, number> = {}
  const currentBlock = await provider.getBlockNumber().catch(() => 0)
  const FROM_BLOCK = Math.max(currentBlock - 500_000, 0)

  // Step 2: QuestionPaid events — native CELO payments (non-fatal)
  try {
    const contract = new ethers.Contract(
      TEACH_AGENT_CONTRACT,
      ["event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount)"],
      provider
    )
    const events = await contract.queryFilter(contract.filters.QuestionPaid(), FROM_BLOCK, "latest")
    for (const ev of events) {
      const args = (ev as ethers.Event & { args: { student: string } }).args
      if (args?.student) {
        const addr = args.student.toLowerCase()
        userCounts[addr] = (userCounts[addr] || 0) + 1
      }
    }
  } catch (err: any) {
    console.error("[stats] QuestionPaid query failed (non-fatal):", err.message)
  }

  // Step 3: cUSD Transfer events to contract — MiniPay payments (non-fatal)
  let cusdQuestions = 0
  try {
    const cUSD = new ethers.Contract(
      CUSD_ADDRESS,
      ["event Transfer(address indexed from, address indexed to, uint256 value)"],
      provider
    )
    const filter = cUSD.filters.Transfer(null, TEACH_AGENT_CONTRACT)
    const events = await cUSD.queryFilter(filter, FROM_BLOCK, "latest")
    for (const ev of events) {
      const args = (ev as ethers.Event & { args: { from: string; to: string; value: ethers.BigNumber } }).args
      if (args?.value?.gte(PRICE_CUSD)) {
        const addr = args.from.toLowerCase()
        userCounts[addr] = (userCounts[addr] || 0) + 1
        cusdQuestions++
      }
    }
  } catch (err: any) {
    console.error("[stats] cUSD Transfer query failed (non-fatal):", err.message)
  }

  const totalQuestions = celoQuestions + cusdQuestions
  const leaderboard = Object.entries(userCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([address, questions], i) => ({ rank: i + 1, address, questions }))

  res.json({
    totalQuestions,
    totalCELO: parseFloat((celoQuestions * 0.001).toFixed(4)),
    totalCUSD: parseFloat((cusdQuestions * 0.001).toFixed(4)),
    uniqueUsers: Object.keys(userCounts).length,
    leaderboard,
    contract: TEACH_AGENT_CONTRACT,
    network: "Celo Mainnet",
    updatedAt: new Date().toISOString(),
  })
})

// GET /agent/history/:address — return stored conversation history for a wallet
agentRouter.get("/history/:address", async (req: Request, res: Response) => {
  const { address } = req.params
  if (!address || !ethers.utils.isAddress(address)) {
    return res.status(400).json({ error: "Valid address required" })
  }
  try {
    const history = await getHistory(address)
    const freeUsed = await isFreeUsed(address)
    res.json({ history, freeUsed })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /agent/health (alias)
agentRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})