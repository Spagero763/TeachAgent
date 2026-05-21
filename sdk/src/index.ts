/**
 * teachagent-sdk
 * Add verified Celo blockchain Q&A to any app or agent.
 *
 * TeachAgent is a pay-per-question AI tutor on Celo. The first question per
 * wallet/agent address is free; subsequent answers require a 0.001 CELO onchain
 * payment (or 0.001 cUSD via MiniPay), verified before the answer is returned.
 *
 * Docs:   https://github.com/Spagero763/TeachAgent
 * Live:   https://teach-agent.vercel.app
 * Agent:  ERC-8004 #9099 (Celo Mainnet)
 */

export const DEFAULT_BASE_URL = "https://teachagent.onrender.com"
export const TEACH_AGENT_CONTRACT = "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA"
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"
export const CELO_CHAIN_ID = 42220

export interface TeachAgentOptions {
  /** Override the API base URL (defaults to the public TeachAgent backend). */
  baseUrl?: string
  /** Default address used for free-tier tracking and history when not passed per-call. */
  address?: string
}

export interface AskOptions {
  /** Wallet/agent address asking the question. Required (used for free tier + history). */
  address?: string
  /** Onchain payment tx hash. Omit for the free first question; required after. */
  txHash?: string
}

export interface AskResult {
  question: string
  answer: string
  /** True if this answer was served under the free first-question tier. */
  free: boolean
  /** Present when the answer was paid for. */
  payment?: { txHash: string; payer: string; amount: string; verified: boolean }
  /** Set when the backend requires payment (HTTP 402). */
  paymentRequired?: boolean
}

export interface PaymentRequirements {
  contract: string
  chainId: number
  price: string
  token: string
  method: string
}

export interface Stats {
  totalQuestions: number
  totalCELO: number
  totalCUSD: number
  uniqueUsers: number
  leaderboard: { rank: number; address: string; questions: number }[]
  contract: string
  network: string
  updatedAt: string
}

export class PaymentRequiredError extends Error {
  requirements: PaymentRequirements
  constructor(message: string, requirements: PaymentRequirements) {
    super(message)
    this.name = "PaymentRequiredError"
    this.requirements = requirements
  }
}

/**
 * TeachAgent client — query verified Celo knowledge from any app or agent.
 *
 * @example
 * ```ts
 * import { TeachAgent } from "teachagent-sdk"
 * const ta = new TeachAgent({ address: "0xYourWallet" })
 * const { answer, free } = await ta.ask("What is cUSD?")
 * console.log(answer)
 * ```
 */
export class TeachAgent {
  private baseUrl: string
  private address?: string

  constructor(opts: TeachAgentOptions = {}) {
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "")
    this.address = opts.address
  }

  /**
   * Ask a Celo question. Returns the answer, or throws PaymentRequiredError
   * if payment is needed and no txHash was supplied.
   */
  async ask(question: string, opts: AskOptions = {}): Promise<AskResult> {
    const address = opts.address || this.address
    if (!question?.trim()) throw new Error("question is required")
    if (!address) throw new Error("address is required (pass in constructor or per-call)")

    const res = await fetch(`${this.baseUrl}/agent/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question.trim(), studentAddress: address, txHash: opts.txHash }),
    })

    const data = await res.json()

    if (res.status === 402) {
      throw new PaymentRequiredError(
        data.message || "Payment required",
        {
          contract: data.contract || TEACH_AGENT_CONTRACT,
          chainId: data.chainId || CELO_CHAIN_ID,
          price: data.price || "0.001",
          token: data.token || "CELO",
          method: data.method || "payForQuestion()",
        }
      )
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)

    return {
      question: data.question,
      answer: data.answer,
      free: !!data.freeQuestion,
      payment: data.payment,
    }
  }

  /**
   * Agent-to-agent query using the A2A message envelope.
   * Use this when one autonomous agent queries TeachAgent's knowledge.
   */
  async a2a(question: string, opts: AskOptions = {}): Promise<AskResult> {
    const address = opts.address || this.address
    if (!question?.trim()) throw new Error("question is required")
    if (!address) throw new Error("agentAddress is required")

    const res = await fetch(`${this.baseUrl}/agent/a2a`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: { role: "user", parts: [{ type: "text", text: question.trim() }] },
        agentAddress: address,
        txHash: opts.txHash,
      }),
    })

    const data = await res.json()

    if (res.status === 402) {
      throw new PaymentRequiredError(data.message || "Payment required", {
        contract: data.contract || TEACH_AGENT_CONTRACT,
        chainId: data.chainId || CELO_CHAIN_ID,
        price: data.price || "0.001",
        token: data.token || "CELO",
        method: data.method || "payForQuestion()",
      })
    }
    if (!res.ok) throw new Error(data.error || `A2A request failed (${res.status})`)

    const answer = data?.message?.parts?.filter((p: any) => p?.type === "text").map((p: any) => p.text).join("\n") || ""
    return { question: question.trim(), answer, free: !!data.freeQuery, payment: data.payment }
  }

  /** Fetch live onchain usage stats (questions, earnings, unique users, leaderboard). */
  async stats(): Promise<Stats> {
    const res = await fetch(`${this.baseUrl}/agent/stats`)
    if (!res.ok) throw new Error(`Stats request failed (${res.status})`)
    return res.json()
  }

  /** Fetch the agent identity card (ERC-8004 + payment info). */
  async identity(): Promise<Record<string, any>> {
    const res = await fetch(`${this.baseUrl}/agent/identity`)
    if (!res.ok) throw new Error(`Identity request failed (${res.status})`)
    return res.json()
  }

  /** Get the conversation history stored for an address. */
  async history(address?: string): Promise<{ history: { role: string; content: string }[]; freeUsed: boolean }> {
    const addr = address || this.address
    if (!addr) throw new Error("address is required")
    const res = await fetch(`${this.baseUrl}/agent/history/${addr}`)
    if (!res.ok) throw new Error(`History request failed (${res.status})`)
    return res.json()
  }
}

export default TeachAgent
