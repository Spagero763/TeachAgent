"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import dynamic from "next/dynamic"

const AgentCanvas = dynamic(
  () => import("@/components/AgentCanvas").then(m => ({ default: m.AgentCanvas })),
  { ssr: false }
)

const AGENT_URL = "https://teachagent.onrender.com"

const TEACH_AGENT_CONTRACT = process.env.NEXT_PUBLIC_TEACH_AGENT_CONTRACT || "0xYOUR_CONTRACT_ADDRESS"

const CONTRACT_ABI = [
  "function payForQuestion() external payable returns (uint256 questionId)",
  "function pricePerQuestion() external view returns (uint256)",
]

const EXAMPLES = [
  "What is the Celo blockchain?",
  "How does cUSD stay stable?",
  "How do I deploy a smart contract on Celo?",
  "What is MiniPay?",
  "How does EduPay work?",
  "What wallets support Celo?",
]

type Message = {
  role: "user" | "agent" | "system"
  text: string
  txHash?: string
}

/* =======================
   ✅ FORMATTER (Fix 6)
======================= */

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 600, color: "#e8e4dc" }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", fontFamily: "monospace", fontSize: 12 }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

function formatAgentText(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/)

  return (
    <div>
      {paragraphs.map((para, pi) => {

        if (para.includes("\n• ") || para.startsWith("• ")) {
          const lines = para.split("\n").filter(l => l.trim())
          return (
            <div key={pi} style={{ marginBottom: 16 }}>
              {lines.map((line, li) => {
                if (line.startsWith("• ") || line.startsWith("- ")) {
                  return (
                    <div key={li} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                      <span style={{ color: "#818cf8" }}>·</span>
                      <span style={{ fontSize: 14, color: "rgba(232,228,220,0.75)" }}>
                        {formatInline(line.replace(/^[•\-]\s*/, ""))}
                      </span>
                    </div>
                  )
                }
                return <p key={li}>{formatInline(line)}</p>
              })}
            </div>
          )
        }

        if (para.includes("```")) {
          const code = para.replace(/```\w*\n?/g, "").replace(/```/g, "").trim()
          return (
            <pre key={pi} style={{ background: "rgba(255,255,255,0.04)", padding: 16 }}>
              <code>{code}</code>
            </pre>
          )
        }

        if (para.startsWith("# ")) {
          return <h2 key={pi}>{para.replace(/^#\s*/, "")}</h2>
        }
        if (para.startsWith("## ")) {
          return <h3 key={pi}>{para.replace(/^##\s*/, "")}</h3>
        }
        if (para.startsWith("### ")) {
          return <h4 key={pi}>{para.replace(/^###\s*/, "")}</h4>
        }

        if (/^\d+\.\s/.test(para)) {
          const lines = para.split("\n")
          return (
            <div key={pi}>
              {lines.map((line, li) => {
                const match = line.match(/^(\d+)\.\s(.*)/)
                if (match) {
                  return (
                    <div key={li} style={{ display: "flex", gap: 10 }}>
                      <span style={{ color: "#818cf8" }}>{match[1]}.</span>
                      <span>{formatInline(match[2])}</span>
                    </div>
                  )
                }
                return <p key={li}>{formatInline(line)}</p>
              })}
            </div>
          )
        }

        if (para.trim()) {
          return <p key={pi}>{formatInline(para)}</p>
        }

        return null
      })}
    </div>
  )
}

/* =======================
   COMPONENT
======================= */

export default function Home() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [showHero, setShowHero] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  function addMessage(msg: Message) {
    setMessages(prev => [...prev, msg])
  }

  async function handleSend() {
    const q = input.trim()
    if (!q || loading) return

    if (!isConnected || !address) {
      open()
      return
    }

    setShowHero(false)
    setInput("")
    addMessage({ role: "user", text: q })
    setLoading(true)

    try {
      const r = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, studentAddress: address }),
      })

      const d = await r.json()
      addMessage({ role: "agent", text: d.answer || "No response" })
    } catch {
      addMessage({ role: "system", text: "Error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />

      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === "agent"
              ? formatAgentText(msg.text) // ✅ FIX APPLIED
              : msg.text}
          </div>
        ))}
      </div>

      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  )
}