import { getPaymentRequirements, verifyPayment, CUSD_ADDRESS } from "../lib/x402"
import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { scoreEducator, runTutoringSession } from "../lib/claude"
import { eduPayContract, agentRegistry, agentWallet, AGENT_REGISTRY_ADDRESS, provider } from "../lib/celo"
import dotenv from "dotenv"
dotenv.config()

export const agentRouter = Router()

// GET /agent/identity — returns agent's ERC-8004 identity
agentRouter.get("/identity", async (req: Request, res: Response) => {
  try {
    res.json({
      agentAddress: agentWallet.address,
      identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY,
      agentRegistry: process.env.ERC8004_REPUTATION_REGISTRY,
      network: "Celo Mainnet",
      chainId: 42220,
      agentCard: {
        name: "TeachAgent",
        description: "AI agent that scores educators and provides tutoring sessions on Celo",
        version: "1.0.0",
        capabilities: ["educator-scoring", "tutoring-sessions", "reputation-tracking"],
        paymentToken: "cUSD",
        pricePerSession: "0.1 cUSD",
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /agent/score — score an educator from their EduPay data
agentRouter.post("/score", async (req: Request, res: Response) => {
  const { tutorAddress } = req.body

  if (!tutorAddress || !ethers.utils.isAddress(tutorAddress)) {
    return res.status(400).json({ error: "Valid tutor address required" })
  }

  try {
    // Fetch tutor data from EduPay contract
    const courseIds: number[] = await eduPayContract.getTutorCourses(tutorAddress)
    const totalEarned = await eduPayContract.tutorEarnings(tutorAddress)

    const courseDetails = []
    for (const id of courseIds) {
      const course = await eduPayContract.courses(id)
      courseDetails.push({
        title: course.title,
        description: course.description,
        chapterCount: Number(course.chapterCount),
      })
    }

    // Score with Claude
    const result = await scoreEducator({
      tutorAddress,
      courseCount: courseIds.length,
      totalEarned: ethers.utils.formatEther(totalEarned),
      courseDetails,
    })

    // Post feedback to ERC-8004 Reputation Registry
    // score is -127 to 127 — map 0-100 to 0-100 as int8
    const agentId = process.env.AGENT_ID
    if (agentId) {
      try {
        const score8 = Math.min(100, Math.max(0, result.score)) as number
        await agentRegistry.giveFeedback(
          Number(agentId),
          score8,
          "educator-score",
          `ipfs://teachagent-score-${tutorAddress}`
        )
      } catch (repErr) {
        console.warn("Reputation posting failed (non-fatal):", repErr)
      }
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
    console.error("Score error:", err)
    res.status(500).json({ 
      error: err.message,
      hint: "Check ANTHROPIC_API_KEY in environment variables"
    })
  }
})

// POST /agent/session — x402 pay-per-question
agentRouter.post("/session", async (req: Request, res: Response) => {
  const { question, courseTitle, tutorAddress, studentAddress, txHash } = req.body

  if (!question || !courseTitle) {
    return res.status(400).json({
      error: "question and courseTitle are required",
    })
  }

  // ── Step 1: No txHash → return 402 with payment requirements ──
  if (!txHash) {
    const requirements = getPaymentRequirements(agentWallet.address)
    return res.status(402).json({
      error: "Payment required",
      message: "Send 0.001 cUSD to TeachAgent on Celo to unlock this session",
      payTo: agentWallet.address,
      amount: "0.001",
      token: "cUSD",
      tokenAddress: CUSD_ADDRESS,
      network: "Celo Mainnet",
      chainId: 42220,
      miniPayCompatible: true,
      instructions: {
        step1: "Approve cUSD spend: approve(agentAddress, 1000000000000000)",
        step2: "Transfer cUSD: transfer(agentAddress, 1000000000000000)",
        step3: "Re-call this endpoint with the txHash",
      },
      requirements,
    })
  }

  // ── Step 2: txHash provided → verify payment ──
  try {
    const { valid, payer, error: payErr } = await verifyPayment(
      txHash,
      agentWallet.address,
      provider
    )

    if (!valid) {
      return res.status(402).json({
        error: "Payment verification failed",
        reason: payErr,
        txHash,
      })
    }

    // ── Step 3: Payment verified → run AI session ──
    const answer = await runTutoringSession({
      question,
      courseTitle,
      tutorAddress: tutorAddress || "unknown",
      studentAddress: studentAddress || payer || "unknown",
    })

    res.json({
      question,
      answer,
      course: courseTitle,
      tutor: tutorAddress,
      student: studentAddress || payer,
      sessionAt: new Date().toISOString(),
      payment: {
        txHash,
        payer,
        amount: "0.001 cUSD",
        verified: true,
        network: "Celo Mainnet",
      },
      miniPayCompatible: true,
    })
  } catch (err: any) {
    console.error("Session error:", err)
    res.status(500).json({ error: err.message })
  }
})

// GET /agent/reputation — get agent's own reputation summary
agentRouter.get("/reputation", async (req: Request, res: Response) => {
  try {
    const agentId = process.env.AGENT_ID
    if (!agentId) {
      return res.json({
        message: "Agent not yet registered",
        agentAddress: agentWallet.address,
        registry: AGENT_REGISTRY_ADDRESS,
      })
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

// POST /agent/register — register agent on ERC-8004
agentRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const agentCardURI = req.body.agentCardURI ||
      `https://teachagent-production.up.railway.app/.well-known/agent-card.json`

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
      agentCardURI,
      registry: AGENT_REGISTRY_ADDRESS,
      message: `Set AGENT_ID=${agentId} in your env`,
      viewOnCeloscan: `https://celoscan.io/address/${AGENT_REGISTRY_ADDRESS}`,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})