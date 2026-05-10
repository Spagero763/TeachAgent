import dotenv from "dotenv"
dotenv.config()

type Message = { role: string; content: string }

// Upstash Redis client — only loaded if env vars are present
let redis: any = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require("@upstash/redis")
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  console.log("[memory] Using Upstash Redis for persistent storage")
} else {
  console.log("[memory] No Upstash credentials — using in-memory storage (resets on restart)")
}

// In-memory fallback
const memoryStore: Record<string, Message[]> = {}
const usedHashesSet = new Set<string>()

const HISTORY_KEY = (addr: string) => `ta:history:${addr.toLowerCase()}`
const USED_KEY = (hash: string) => `ta:used:${hash.toLowerCase()}`
const MAX_HISTORY = 6

export async function getHistory(address: string): Promise<Message[]> {
  if (!redis) return memoryStore[address.toLowerCase()] || []
  try {
    const data = await redis.get(HISTORY_KEY(address))
    return Array.isArray(data) ? data : []
  } catch {
    return memoryStore[address.toLowerCase()] || []
  }
}

export async function saveHistory(address: string, history: Message[]): Promise<void> {
  const trimmed = history.slice(-MAX_HISTORY)
  if (!redis) {
    memoryStore[address.toLowerCase()] = trimmed
    return
  }
  try {
    // Expire after 7 days of inactivity
    await redis.set(HISTORY_KEY(address), trimmed, { ex: 60 * 60 * 24 * 7 })
  } catch {
    memoryStore[address.toLowerCase()] = trimmed
  }
}

export async function isTxUsed(txHash: string): Promise<boolean> {
  if (!redis) return usedHashesSet.has(txHash.toLowerCase())
  try {
    const val = await redis.get(USED_KEY(txHash))
    return val === 1
  } catch {
    return usedHashesSet.has(txHash.toLowerCase())
  }
}

export async function markTxUsed(txHash: string): Promise<void> {
  if (!redis) {
    usedHashesSet.add(txHash.toLowerCase())
    return
  }
  try {
    // Keep used hash record for 30 days
    await redis.set(USED_KEY(txHash), 1, { ex: 60 * 60 * 24 * 30 })
  } catch {
    usedHashesSet.add(txHash.toLowerCase())
  }
}
