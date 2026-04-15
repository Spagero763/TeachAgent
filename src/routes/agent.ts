import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { scoreEducator, runTutoringSession } from "../lib/groq"
import { eduPayContract, agentRegistry, agentWallet, AGENT_REGISTRY_ADDRESS, provider } from "../lib/celo"
import { getPaymentRequirements, verifyPayment } from "../lib/x402"
import dotenv from "dotenv"
dotenv.config()

export const agentRouter = Router()

// GET /agent/identity
agentRouter.get("/identity", (_req: Request, res: Response) => {
  res.json({
    agentId: process.env.AGENT_ID || "1",
    agentAddress: agentWallet.address,
    registry: AGENT_REGISTRY_ADDRESS,
    network: "Celo Mainnet",
    chainId: 42220,
    name: "TeachAgent",
    description: "AI agent scoring educators and providing tutoring on Celo",
    version: "1.0.0",
    capabilities: ["educator-scoring", "tutoring-sessions", "reputation-tracking"],
    payment: { token: "cUSD", amount: "0.0001", per: "session" },
    miniPayCompatible: true,
  })
})

// POST /agent/score
agentRouter.post("/score", async (req: Request, res: Response) => {
  const { tutorAddress } = req.body
  if (!tutorAddress || !ethers.utils.isAddress(tutorAddress)) {
    return res.status(400).json({ error: "Valid tutor address required" })
  }

  try {
    const courseIds: number[] = await eduPayContract.getTutorCourses(tutorAddress)
    const totalEarned = await eduPayContract.tutorEarnings(tutorAddress)
    const courseDetails = []

    for (const id of courseIds) {
      const c = await eduPayContract.courses(id)
      courseDetails.push({
        title: c.title,
        description: c.description,
        chapterCount: Number(c.chapterCount),
      })
    }

    const result = await scoreEducator({
      tutorAddress,
      courseCount: courseIds.length,
      totalEarned: ethers.utils.formatEther(totalEarned),
      courseDetails,
    })

    // Post reputation onchain (non-blocking)
    const agentId = process.env.AGENT_ID
    if (agentId) {
      agentRegistry.giveFeedback(
        Number(agentId),
        Math.min(100, Math.max(-100, result.score)) as number,
        "educator-score"
      ).catch((e: any) => console.warn("Reputation post failed:", e.message))
    }

    res.json({
      tutor: tutorAddress,
      courses: courseIds.length,
      totalEarned: ethers.utils.formatEther(totalEarned) + " cUSD",
      scoring: result,
      scoredAt: new Date().toISOString(),
      network: "Celo Mainnet",
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /agent/session — x402 pay-per-question
agentRouter.post("/session", async (req: Request, res: Response) => {
  const { question, courseTitle, tutorAddress, studentAddress, txHash } = req.body

  if (!question || !courseTitle) {
    return res.status(400).json({ error: "question and courseTitle are required" })
  }

  // No payment — return 402
  if (!txHash) {
    const requirements = getPaymentRequirements(agentWallet.address)
    return res.status(402).json({
      error: "Payment required",
      message: "Send 0.0001 cUSD to unlock this tutoring session",
      ...requirements,
      instructions: {
        step1: "Send 0.0001 cUSD to the payTo address on Celo",
        step2: "Copy the transaction hash",
        step3: "Re-call this endpoint with txHash in the body",
        miniPay: "Open MiniPay → Send → paste payTo address → amount: 0.0001 cUSD → copy txHash",
      },
    })
  }

  // Verify payment
  try {
    const { valid, payer, error: payErr } = await verifyPayment(txHash, agentWallet.address, provider)
    if (!valid) {
      return res.status(402).json({ error: "Payment verification failed", reason: payErr, txHash })
    }

    const answer = await runTutoringSession({
      question,
      courseTitle,
      studentAddress: studentAddress || payer || "anonymous",
    })

    res.json({
      question,
      answer,
      course: courseTitle,
      tutor: tutorAddress,
      student: studentAddress || payer,
      sessionAt: new Date().toISOString(),
      payment: { txHash, payer, amount: "0.0001 cUSD", verified: true },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /agent/reputation
agentRouter.get("/reputation", async (_req: Request, res: Response) => {
  try {
    const agentId = process.env.AGENT_ID
    if (!agentId) {
      return res.json({ message: "Agent not registered yet", agentAddress: agentWallet.address })
    }
    const rep = await agentRegistry.getReputation(Number(agentId))
    res.json({
      agentId,
      agentAddress: agentWallet.address,
      totalScore: rep.total.toString(),
      feedbackCount: rep.count.toString(),
      averageScore: rep.average.toString(),
      registry: AGENT_REGISTRY_ADDRESS,
      network: "Celo Mainnet",
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /agent/register
agentRouter.post("/register", async (_req: Request, res: Response) => {
  try {
    const agentCardURI = "https://teachagent.onrender.com/.well-known/agent-card.json"
    const tx = await agentRegistry.register(agentCardURI)
    const receipt = await tx.wait()

    const iface = new ethers.utils.Interface([
      "event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI)",
    ])

    let agentId = null
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed.name === "AgentRegistered") {
          agentId = parsed.args.agentId.toString()
        }
      } catch {}
    }

    res.json({
      success: true,
      agentId,
      txHash: receipt.transactionHash,
      registry: AGENT_REGISTRY_ADDRESS,
      message: `Set AGENT_ID=${agentId} in your environment variables`,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})