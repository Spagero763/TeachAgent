import { Router, Request, Response } from "express"
import { ethers } from "ethers"
import { scoreEducator, runTutoringSession } from "../lib/claude"
import { eduPayContract, identityRegistry, reputationRegistry, agentWallet } from "../lib/celo"
import dotenv from "dotenv"
dotenv.config()

export const agentRouter = Router()

// GET /agent/identity — returns agent's ERC-8004 identity
agentRouter.get("/identity", async (req: Request, res: Response) => {
  try {
    res.json({
      agentAddress: agentWallet.address,
      identityRegistry: process.env.ERC8004_IDENTITY_REGISTRY,
      reputationRegistry: process.env.ERC8004_REPUTATION_REGISTRY,
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
        await reputationRegistry.giveFeedback(
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
    res.status(500).json({ error: err.message })
  }
})

// POST /agent/session — pay-per-question tutoring session
agentRouter.post("/session", async (req: Request, res: Response) => {
  const { question, courseTitle, tutorAddress, studentAddress } = req.body

  if (!question || !courseTitle || !tutorAddress || !studentAddress) {
    return res.status(400).json({
      error: "question, courseTitle, tutorAddress and studentAddress required",
    })
  }

  try {
    const answer = await runTutoringSession({
      question,
      courseTitle,
      tutorAddress,
      studentAddress,
    })

    res.json({
      question,
      answer,
      course: courseTitle,
      tutor: tutorAddress,
      student: studentAddress,
      sessionAt: new Date().toISOString(),
      fee: "0.1 cUSD",
      note: "x402 payment integration coming in v2",
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /agent/reputation — get agent's own reputation summary
agentRouter.get("/reputation", async (req: Request, res: Response) => {
  try {
    const agentId = process.env.AGENT_ID
    if (!agentId) {
      return res.json({
        message: "Agent not yet registered on ERC-8004",
        agentAddress: agentWallet.address,
        registrationGuide: "POST /agent/register to register",
      })
    }

    const summary = await reputationRegistry.getSummary(Number(agentId))
    res.json({
      agentId,
      agentAddress: agentWallet.address,
      totalScore: summary.totalScore.toString(),
      feedbackCount: summary.feedbackCount.toString(),
      averageScore: summary.feedbackCount.gt(0)
        ? summary.totalScore.div(summary.feedbackCount).toString()
        : "0",
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
    const tx = await identityRegistry.register(agentCardURI)
    const receipt = await tx.wait()

    // Extract agentId from Transfer event
    const iface = new ethers.utils.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    ])

    let agentId = null
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log)
        if (parsed.name === "Transfer") {
          agentId = parsed.args.tokenId.toString()
        }
      } catch {}
    }

    res.json({
      success: true,
      agentId,
      txHash: receipt.transactionHash,
      agentCardURI,
      message: `Set AGENT_ID=${agentId} in your .env file`,
      viewOn8004scan: `https://8004scan.io/agent/${agentId}`,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})