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

  // Sanitize question — strip control characters
  const cleanQuestion = question.trim().replace(/[\x00-\x1F\x7F]/g, " ")

  // No payment yet — check if wallet qualifies for free first question
  if (!txHash) {
    if (!studentAddress || !ethers.utils.isAddress(studentAddress)) {
      return res.status(400).json({ error: "Valid studentAddress required" })
    }
    const freeUsed = await isFreeUsed(studentAddress)
    if (!freeUsed) {
      // Answer the first question for free
      const history = await getHistory(studentAddress)
      const answer = await askCelo(cleanQuestion, history)
      await saveHistory(studentAddress, [
        ...history,
        { role: "user", content: question.trim() },
        { role: "assistant", content: answer },
      ])
      await markFreeUsed(studentAddress)
      return res.json({
        question: cleanQuestion,
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
    const answer = await askCelo(cleanQuestion, history)

    await saveHistory(studentAddress, [
      ...history,
      { role: "user", content: question.trim() },
      { role: "assistant", content: answer },
    ])

    // Mark txHash as used ONLY after successful Groq generation
    await markTxUsed(txHash)

    res.json({
      question: cleanQuestion,
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

// Cache stats for 30s to avoid hammering Forno RPC on every page load
let statsCache: { data: any; expires: number } | null = null
const STATS_CACHE_TTL_MS = 30_000

// Payment contracts to aggregate. Both emit QuestionPaid + receive cUSD, so
// stats span the full history: the legacy contract (frozen) AND the current V2.
const LEGACY_CONTRACT = "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA"
const LEGACY_DEPLOY_BLOCK = 64514140 // legacy V1 deploy block
const V2_DEPLOY_BLOCK = 67460000     // current V2 deploy block

// Legacy contract is no longer used for new payments — its data never changes,
// so cache it for the whole process lifetime instead of re-scanning every time.
type ContractStats = { userCounts: Record<string, number>; celoQuestions: number; cusdQuestions: number }
let legacyStatsCache: ContractStats | null = null

const CHUNK_SIZE = 10000
async function queryInChunks(
  contract: ethers.Contract,
  filter: ethers.EventFilter,
  fromBlock: number,
  toBlock: number
): Promise<ethers.Event[]> {
  const allEvents: ethers.Event[] = []
  for (let from = fromBlock; from <= toBlock; from += CHUNK_SIZE) {
    const to = Math.min(from + CHUNK_SIZE - 1, toBlock)
    try {
      allEvents.push(...(await contract.queryFilter(filter, from, to)))
    } catch (err: any) {
      console.error(`[stats] chunk ${from}-${to} failed:`, err.message)
    }
  }
  return allEvents
}

// Collect CELO + cUSD payment stats for a single contract address.
async function collectContractStats(address: string, deployBlock: number, currentBlock: number): Promise<ContractStats> {
  const userCounts: Record<string, number> = {}
  let celoQuestions = 0
  let cusdQuestions = 0

  // Native CELO totalQuestions() counter
  try {
    const c = new ethers.Contract(address, ["function totalQuestions() view returns (uint256)"], provider)
    celoQuestions = (await c.totalQuestions() as ethers.BigNumber).toNumber()
  } catch (err: any) {
    console.error(`[stats] totalQuestions(${address}) failed:`, err.message)
  }

  // QuestionPaid events → per-user counts (CELO payers)
  try {
    const c = new ethers.Contract(address, ["event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount)"], provider)
    const events = await queryInChunks(c, c.filters.QuestionPaid(), deployBlock, currentBlock)
    for (const ev of events) {
      const student = (ev as ethers.Event & { args: { student: string } }).args?.student
      if (student) userCounts[student.toLowerCase()] = (userCounts[student.toLowerCase()] || 0) + 1
    }
  } catch (err: any) {
    console.error(`[stats] QuestionPaid(${address}) failed:`, err.message)
  }

  // cUSD transfers into the contract → MiniPay payers
  try {
    const cUSD = new ethers.Contract(CUSD_ADDRESS, ["event Transfer(address indexed from, address indexed to, uint256 value)"], provider)
    const events = await queryInChunks(cUSD, cUSD.filters.Transfer(null, address), deployBlock, currentBlock)
    for (const ev of events) {
      const args = (ev as ethers.Event & { args: { from: string; value: ethers.BigNumber } }).args
      if (args?.value?.gte(PRICE_CUSD)) {
        userCounts[args.from.toLowerCase()] = (userCounts[args.from.toLowerCase()] || 0) + 1
        cusdQuestions++
      }
    }
  } catch (err: any) {
    console.error(`[stats] cUSD Transfer(${address}) failed:`, err.message)
  }

  return { userCounts, celoQuestions, cusdQuestions }
}

agentRouter.get("/stats", async (_req: Request, res: Response) => {
  // Serve cached response if fresh
  if (statsCache && Date.now() < statsCache.expires) {
    return res.json({ ...statsCache.data, cached: true })
  }

  const currentBlock = await provider.getBlockNumber().catch(() => 0)
  if (!currentBlock) {
    return res.status(500).json({ error: "Could not read current block" })
  }

  // Legacy contract is frozen — query once, then reuse for the process lifetime
  if (!legacyStatsCache) {
    legacyStatsCache = await collectContractStats(LEGACY_CONTRACT, LEGACY_DEPLOY_BLOCK, currentBlock)
  }
  // Current V2 contract — query live each refresh
  const current = await collectContractStats(TEACH_AGENT_CONTRACT, V2_DEPLOY_BLOCK, currentBlock)

  // Merge legacy + current: combined user counts and totals
  const userCounts: Record<string, number> = { ...legacyStatsCache.userCounts }
  for (const [addr, n] of Object.entries(current.userCounts)) {
    userCounts[addr] = (userCounts[addr] || 0) + n
  }
  const celoQuestions = legacyStatsCache.celoQuestions + current.celoQuestions
  const cusdQuestions = legacyStatsCache.cusdQuestions + current.cusdQuestions

  const totalQuestions = celoQuestions + cusdQuestions
  const leaderboard = Object.entries(userCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([address, questions], i) => ({ rank: i + 1, address, questions }))

  const response = {
    totalQuestions,
    totalCELO: parseFloat((celoQuestions * 0.001).toFixed(4)),
    totalCUSD: parseFloat((cusdQuestions * 0.001).toFixed(4)),
    uniqueUsers: Object.keys(userCounts).length,
    leaderboard,
    contract: TEACH_AGENT_CONTRACT,
    contracts: [LEGACY_CONTRACT, TEACH_AGENT_CONTRACT],
    network: "Celo Mainnet",
    updatedAt: new Date().toISOString(),
  }

  // Cache for 30s
  statsCache = { data: response, expires: Date.now() + STATS_CACHE_TTL_MS }

  res.json(response)
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

// ─────────────────────────────────────────────────────────────
// AGENT-TO-AGENT (A2A) — infrastructure for other agents/dApps
// Other agents query TeachAgent's verified Celo knowledge.
// Follows an A2A-style message envelope and the x402 payment flow.
// ─────────────────────────────────────────────────────────────

// GET /agent/a2a — A2A skill descriptor (what this endpoint does)
agentRouter.get("/a2a", (_req: Request, res: Response) => {
  res.json({
    protocol: "a2a",
    skill: {
      id: "celo-knowledge-query",
      name: "Celo Knowledge Query",
      description: "Query verified, up-to-date knowledge about the Celo blockchain ecosystem — contracts, MiniPay, stablecoins, DeFi, staking, governance, and developer tooling.",
      tags: ["celo", "blockchain", "knowledge", "education", "qa"],
      inputModes: ["text"],
      outputModes: ["text"],
    },
    invoke: {
      method: "POST",
      url: "https://teachagent.onrender.com/agent/a2a",
      body: { message: { role: "user", parts: [{ type: "text", text: "<your question>" }] }, agentAddress: "0x...", txHash: "0x... (after payment)" },
    },
    payment: {
      ...getPaymentRequirements(),
      x402: true,
      note: "First query per agent address is free. Subsequent queries require 0.001 CELO via payForQuestion() or 0.001 cUSD transfer.",
    },
    identity: { standard: "ERC-8004", chainId: 42220, agentId: 9099 },
  })
})

// POST /agent/a2a — agent-to-agent query with x402 payment flow
agentRouter.post("/a2a", async (req: Request, res: Response) => {
  const { message, agentAddress, txHash } = req.body

  // Extract text from A2A message envelope (or accept a plain { question })
  let question: string | undefined = req.body?.question
  if (!question && message?.parts?.length) {
    question = message.parts.filter((p: any) => p?.type === "text" && p?.text).map((p: any) => p.text).join("\n").trim()
  }
  if (!question?.trim()) {
    return res.status(400).json({ error: "A2A message must contain a text part with a question" })
  }
  if (!agentAddress || !ethers.utils.isAddress(agentAddress)) {
    return res.status(400).json({ error: "Valid agentAddress required" })
  }

  const cleanQuestion = question.trim().replace(/[\x00-\x1F\x7F]/g, " ")

  function a2aReply(answer: string, extra: Record<string, any> = {}) {
    return {
      protocol: "a2a",
      message: { role: "agent", parts: [{ type: "text", text: answer }] },
      ...extra,
    }
  }

  try {
    // No payment yet — free first query per agent, else 402 with x402 requirements
    if (!txHash) {
      const freeUsed = await isFreeUsed(agentAddress)
      if (!freeUsed) {
        const history = await getHistory(agentAddress)
        const answer = await askCelo(cleanQuestion, history)
        await saveHistory(agentAddress, [...history, { role: "user", content: cleanQuestion }, { role: "assistant", content: answer }])
        await markFreeUsed(agentAddress)
        return res.json(a2aReply(answer, { freeQuery: true }))
      }
      // x402: signal payment required with machine-readable requirements
      res.setHeader("X-Payment-Required", "true")
      return res.status(402).json({
        protocol: "a2a",
        error: "Payment required",
        x402: true,
        ...getPaymentRequirements(),
        message: "Pay 0.001 CELO via payForQuestion() (or 0.001 cUSD transfer), then resend with txHash.",
      })
    }

    // Paid path — verify onchain, prevent replay
    if (await isTxUsed(txHash)) {
      return res.status(400).json({ protocol: "a2a", error: "Transaction already used" })
    }
    const { valid, payer, error: payErr } = await verifyPayment(txHash, agentAddress, provider)
    if (!valid) {
      return res.status(402).json({ protocol: "a2a", error: "Payment verification failed", reason: payErr })
    }

    const history = await getHistory(agentAddress)
    const answer = await askCelo(cleanQuestion, history)
    await saveHistory(agentAddress, [...history, { role: "user", content: cleanQuestion }, { role: "assistant", content: answer }])
    await markTxUsed(txHash)

    return res.json(a2aReply(answer, { payment: { txHash, payer: payer || agentAddress, amount: "0.001 CELO", verified: true } }))
  } catch (err: any) {
    return res.status(500).json({ protocol: "a2a", error: err.message })
  }
})

// GET /agent/health (alias)
agentRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})