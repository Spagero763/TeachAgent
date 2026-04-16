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

// Replace with your deployed contract address
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

function T(style: React.CSSProperties) { return style }

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
  setStatus("")

  try {
    const r1 = await fetch(`${AGENT_URL}/agent/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, studentAddress: address }),
    }).catch(() => null)

    if (!r1) {
      addMessage({ role: "system", text: "⚠️ Backend is starting up. Please wait 30 seconds and try again." })
      setLoading(false)
      return
    }

    if (r1.status !== 402) {
      const d = await r1.json()
      addMessage({ role: "agent", text: d.answer || d.error || "No response" })
      setLoading(false)
      return
    }

    setStatus("Preparing payment...")

    // Detect provider — MiniPay or WalletConnect
    const eth = (window as any).ethereum
    let web3Provider: ethers.providers.Web3Provider

    if (eth?.isMiniPay) {
      // MiniPay: use window.ethereum directly
      web3Provider = new ethers.providers.Web3Provider(eth)
    } else if (walletProvider) {
      web3Provider = new ethers.providers.Web3Provider(walletProvider as any)
    } else {
      addMessage({ role: "system", text: "No wallet provider. Please reconnect your wallet." })
      setLoading(false)
      return
    }

    setStatus("Confirm 0.001 CELO payment in your wallet...")

    // Switch to Celo mainnet
    try {
      await web3Provider.send("wallet_switchEthereumChain", [{ chainId: "0xa4ec" }])
    } catch {}

    const signer = web3Provider.getSigner()
    const signerAddress = await signer.getAddress()

    const contract = new ethers.Contract(
      TEACH_AGENT_CONTRACT,
      ["function payForQuestion() external payable returns (uint256 questionId)"],
      signer
    )

    setStatus("Waiting for wallet confirmation...")
    const tx = await contract.payForQuestion({
      value: ethers.utils.parseEther("0.001"),
    })

    setStatus("Confirming on Celo...")
    const receipt = await tx.wait()

    setStatus("Getting your answer...")

    const r2 = await fetch(`${AGENT_URL}/agent/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q,
        studentAddress: signerAddress,
        txHash: receipt.transactionHash,
      }),
    })

    const d2 = await r2.json()
    addMessage({
      role: "agent",
      text: d2.answer || d2.error || "No response",
      txHash: receipt.transactionHash,
    })
  } catch (err: any) {
    if (err?.code === 4001 || err?.code === "ACTION_REJECTED") {
      addMessage({ role: "system", text: "Payment cancelled." })
    } else if (err?.message?.includes("insufficient funds")) {
      addMessage({ role: "system", text: "Insufficient CELO. You need at least 0.001 CELO + gas." })
    } else {
      addMessage({ role: "system", text: `Error: ${err?.message || "Unknown error"}` })
    }
  } finally {
    setLoading(false)
    setStatus("")
    inputRef.current?.focus()
  }
}

  return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero — shown until first message */}
      <AnimatePresence>
        {showHero && (
          <motion.section
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            style={{ position: "relative", height: "100vh", display: "flex", alignItems: "flex-end", overflow: "hidden", flexShrink: 0 }}
          >
            {/* 3D Canvas */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <AgentCanvas />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 25%, transparent 70%)", zIndex: 1, pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #080808 20%, transparent 60%)", zIndex: 1, pointerEvents: "none" }} />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", zIndex: 2, padding: "0 40px 80px", maxWidth: 640 }}
            >
              <div style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.28em", textTransform: "uppercase", color: "#818cf8", marginBottom: 24 }}>
                Celo AI · 0.001 CELO per question
              </div>
              <h1 style={{
                fontSize: "clamp(3.5rem, 10vw, 7rem)",
                fontWeight: 100, letterSpacing: "-0.03em",
                lineHeight: 0.92, color: "#e8e4dc",
                textTransform: "uppercase", marginBottom: 24,
              }}>
                Teach<br />
                <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.6)", color: "transparent" }}>Agent</span>
              </h1>
              <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(232,228,220,0.45)", lineHeight: 1.7, marginBottom: 40, maxWidth: 400 }}>
                Your AI guide to the Celo blockchain. Ask anything — smart contracts, wallets, cUSD, MiniPay, DeFi.
              </p>

              {/* Example chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                {EXAMPLES.slice(0, 4).map((q, i) => (
                  <button key={i} onClick={() => { setInput(q); setShowHero(false); inputRef.current?.focus() }}
                    style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", borderRadius: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#818cf8"; e.currentTarget.style.borderColor = "rgba(129,140,248,0.3)" }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(232,228,220,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setShowHero(false); inputRef.current?.focus() }}
                style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8e4dc", background: "rgba(79,70,229,0.7)", border: "none", padding: "14px 32px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Start asking →
              </button>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 800, width: "100%", margin: "0 auto", padding: "0 20px", paddingTop: showHero ? 0 : 100, paddingBottom: 180 }}>

        {/* Messages */}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              marginBottom: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              fontSize: 9, fontWeight: 300, letterSpacing: "0.22em", textTransform: "uppercase",
              marginBottom: 6,
              color: msg.role === "user" ? "rgba(129,140,248,0.5)" : msg.role === "system" ? "rgba(232,228,220,0.2)" : "rgba(232,228,220,0.2)",
            }}>
              {msg.role === "user" ? "You" : msg.role === "system" ? "System" : "TeachAgent"}
            </div>
            <div style={{
              maxWidth: "85%",
              padding: "14px 18px",
              background: msg.role === "user"
                ? "rgba(79,70,229,0.15)"
                : msg.role === "system"
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${msg.role === "user" ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.06)"}`,
              fontSize: 14, fontWeight: 300,
              color: msg.role === "user" ? "#c7d2fe" : msg.role === "system" ? "rgba(232,228,220,0.4)" : "rgba(232,228,220,0.75)",
              lineHeight: 1.8, whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {msg.text}
            </div>
            {msg.txHash && (
              <a href={`https://celoscan.io/tx/${msg.txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, color: "rgba(129,140,248,0.4)", marginTop: 4, textDecoration: "none", letterSpacing: "0.1em" }}
              >
                View payment on Celoscan →
              </a>
            )}
          </motion.div>
        ))}

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 300, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.2)", marginBottom: 6 }}>TeachAgent</div>
            <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "inline-block" }}>
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontSize: 12, fontWeight: 300, color: "#818cf8" }}
              >
                {status || "Thinking..."}
              </motion.span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Fixed input */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,8,8,0.96)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "16px 20px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {!isConnected && (
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.35)" }}>
                Connect wallet to chat — 0.001 CELO per question
              </span>
              <button onClick={() => open()}
                style={{ fontSize: 10, color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.15em" }}
              >
                Connect →
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={isConnected ? "Ask anything about Celo..." : "Connect wallet to ask..."}
              rows={1}
              disabled={!isConnected || loading}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "12px 16px",
                color: "#e8e4dc",
                fontSize: 14, fontWeight: 300,
                fontFamily: "inherit", outline: "none",
                resize: "none", lineHeight: 1.5,
                minHeight: 46, maxHeight: 120,
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(129,140,248,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !isConnected}
              style={{
                flexShrink: 0,
                fontSize: 10, fontWeight: 300, letterSpacing: "0.18em", textTransform: "uppercase",
                color: "#e8e4dc",
                background: loading || !input.trim() || !isConnected ? "rgba(79,70,229,0.25)" : "rgba(79,70,229,0.7)",
                border: "none", padding: "12px 20px",
                cursor: loading || !input.trim() || !isConnected ? "default" : "pointer",
                fontFamily: "inherit", transition: "background 0.2s",
                whiteSpace: "nowrap",
                minHeight: 46,
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          <div style={{ fontSize: 9, fontWeight: 300, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(232,228,220,0.15)", marginTop: 8 }}>
            Enter to send · Shift+Enter for new line · 0.001 CELO per answer
          </div>
        </div>
      </div>
    </div>
  )
}