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

// The deployed TeachAgentPayment contract on Celo mainnet
const TEACH_AGENT_CONTRACT = "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA"
const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"

// payForQuestion() function selector (keccak256 first 4 bytes)
const PAY_SELECTOR = "0xe4849b32"

// 0.001 CELO in hex
const PAYMENT_VALUE = ethers.utils.parseEther("0.001")
const PAYMENT_HEX = "0x" + PAYMENT_VALUE.toBigInt().toString(16)

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

function AgentMessage({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/)
  return (
    <div>
      {paragraphs.map((para, pi) => {
        if (!para.trim()) return null
        if (para.startsWith("```")) {
          const code = para.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim()
          return (
            <pre key={pi} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px 18px", fontSize: 12, lineHeight: 1.7, overflow: "auto", fontFamily: "monospace", marginBottom: 14 }}>
              <code style={{ color: "#a5b4fc" }}>{code}</code>
            </pre>
          )
        }
        if (para.startsWith("### ")) return <h4 key={pi} style={{ fontSize: 14, fontWeight: 600, color: "#e8e4dc", marginBottom: 10, marginTop: 16 }}>{para.replace(/^###\s*/, "")}</h4>
        if (para.startsWith("## ")) return <h3 key={pi} style={{ fontSize: 16, fontWeight: 600, color: "#e8e4dc", marginBottom: 12, marginTop: 20 }}>{para.replace(/^##\s*/, "")}</h3>
        if (para.startsWith("# ")) return <h2 key={pi} style={{ fontSize: 18, fontWeight: 700, color: "#e8e4dc", marginBottom: 14, marginTop: 24 }}>{para.replace(/^#\s*/, "")}</h2>
        const lines = para.split("\n")
        const hasBullets = lines.some(l => l.match(/^[\-\*•]\s/) || l.match(/^\d+\.\s/))
        if (hasBullets) {
          return (
            <div key={pi} style={{ marginBottom: 14 }}>
              {lines.filter(l => l.trim()).map((line, li) => {
                const bullet = line.match(/^[\-\*•]\s(.*)/)
                const numbered = line.match(/^(\d+)\.\s(.*)/)
                if (bullet) return (
                  <div key={li} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                    <span style={{ color: "#818cf8", flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(232,228,220,0.75)", fontWeight: 300 }}>{renderInline(bullet[1])}</span>
                  </div>
                )
                if (numbered) return (
                  <div key={li} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                    <span style={{ color: "#818cf8", flexShrink: 0, fontSize: 13, fontWeight: 500, minWidth: 18 }}>{numbered[1]}.</span>
                    <span style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(232,228,220,0.75)", fontWeight: 300 }}>{renderInline(numbered[2])}</span>
                  </div>
                )
                return <p key={li} style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(232,228,220,0.75)", fontWeight: 300, marginBottom: 4 }}>{renderInline(line)}</p>
              })}
            </div>
          )
        }
        return <p key={pi} style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(232,228,220,0.75)", marginBottom: 12, fontWeight: 300 }}>{renderInline(para)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} style={{ fontWeight: 600, color: "#e8e4dc" }}>{part.slice(2, -2)}</strong>
        if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i} style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", fontFamily: "monospace", fontSize: 12, color: "#a5b4fc" }}>{part.slice(1, -1)}</code>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

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

  // Call payForQuestion() on the TeachAgentPayment contract with 0.001 CELO
  async function callPayForQuestion(
    signerAddress: string,
    isMiniPay: boolean,
    eth: any,
    wcProvider?: any
  ): Promise<string> {
    if (isMiniPay) {
      // MiniPay: raw eth_sendTransaction
      // MiniPay CAN send native CELO, uses feeCurrency only for gas payment
      const txHash: string = await eth.request({
        method: "eth_sendTransaction",
        params: [{
          from: signerAddress,
          to: TEACH_AGENT_CONTRACT,
          value: PAYMENT_HEX,           // 0.001 CELO value
          data: PAY_SELECTOR,           // payForQuestion()
          gas: "0x30000",              // 196608 gas limit
          feeCurrency: CUSD_ADDRESS,   // pay gas in cUSD (MiniPay feature)
        }]
      })
      return txHash
    } else {
      // MetaMask / WalletConnect
      const web3Provider = new ethers.providers.Web3Provider(wcProvider)
      const signer = web3Provider.getSigner()
      const contract = new ethers.Contract(
        TEACH_AGENT_CONTRACT,
        ["function payForQuestion() external payable returns (uint256)"],
        signer
      )
      const tx = await contract.payForQuestion({
        value: PAYMENT_VALUE,
        gasLimit: 200000,
      })
      const receipt = await tx.wait()
      return receipt.transactionHash
    }
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
      // Step 1: probe backend — will return 402 with payment info
      const r1 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, studentAddress: address }),
      }).catch(() => null)

      if (!r1) {
        addMessage({ role: "system", text: "⚠️ Backend is starting up (cold start). Please wait 30 seconds and try again." })
        setLoading(false)
        return
      }

      // Unexpected 200 — answer without payment (shouldn't happen)
      if (r1.status !== 402) {
        const d = await r1.json()
        addMessage({ role: "agent", text: d.answer || d.error || "No response" })
        setLoading(false)
        return
      }

      // Step 2: pay 0.001 CELO to TeachAgentPayment contract
      const eth = (window as any).ethereum
      const isMiniPay = !!eth?.isMiniPay
      let signerAddress = address

      setStatus("Confirm 0.001 CELO payment in your wallet...")

      if (isMiniPay) {
        const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
        signerAddress = accounts[0]
      } else if (walletProvider) {
        try {
          const wp = new ethers.providers.Web3Provider(walletProvider as any)
          await wp.send("wallet_switchEthereumChain", [{ chainId: "0xa4ec" }])
          signerAddress = await wp.getSigner().getAddress()
        } catch {}
      } else {
        addMessage({ role: "system", text: "No wallet provider found. Please reconnect your wallet." })
        setLoading(false)
        return
      }

      const txHash = await callPayForQuestion(signerAddress, isMiniPay, eth, walletProvider)

      setStatus("Confirming on Celo...")

      // Wait for confirmation
      const provider = isMiniPay
        ? new ethers.providers.Web3Provider(eth)
        : new ethers.providers.Web3Provider(walletProvider as any)

      const receipt = await provider.waitForTransaction(txHash, 1, 90000)
      if (!receipt || receipt.status !== 1) {
        throw new Error("Transaction failed on Celo. Please try again.")
      }

      // Step 3: send txHash to backend, get AI answer
      setStatus("Getting your answer...")

      const r2 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          studentAddress: signerAddress,
          txHash,
        }),
      })

      const d2 = await r2.json()
      addMessage({
        role: "agent",
        text: d2.answer || d2.error || "No response",
        txHash,
      })

    } catch (err: any) {
      const msg = err?.message || ""
      if (err?.code === 4001 || err?.code === "ACTION_REJECTED" || msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled")) {
        addMessage({ role: "system", text: "Payment cancelled." })
      } else if (msg.includes("insufficient funds") || msg.includes("balance")) {
        addMessage({ role: "system", text: "Insufficient CELO balance.\n\nYou need at least 0.001 CELO on Celo mainnet.\n\n• Get CELO from Binance, Coinbase, or any exchange\n• Send to your wallet on Celo network (Chain ID 42220)" })
      } else {
        addMessage({ role: "system", text: `Error: ${msg || "Unknown error"}. Please try again.` })
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

      {/* Hero */}
      <AnimatePresence>
        {showHero && (
          <motion.section
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            style={{ position: "relative", height: "100vh", display: "flex", alignItems: "flex-end", overflow: "hidden", flexShrink: 0 }}
          >
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <AgentCanvas />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 25%, transparent 70%)", zIndex: 1, pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #080808 20%, transparent 60%)", zIndex: 1, pointerEvents: "none" }} />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", zIndex: 2, padding: "0 32px 80px", maxWidth: 640 }}
            >
              <div style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.28em", textTransform: "uppercase", color: "#818cf8", marginBottom: 24 }}>
                Celo AI · 0.001 CELO per question
              </div>
              <h1 style={{ fontSize: "clamp(3rem, 10vw, 7rem)", fontWeight: 100, letterSpacing: "-0.03em", lineHeight: 0.92, color: "#e8e4dc", textTransform: "uppercase", marginBottom: 24 }}>
                Teach<br />
                <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.6)", color: "transparent" }}>Agent</span>
              </h1>
              <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(232,228,220,0.45)", lineHeight: 1.7, marginBottom: 40, maxWidth: 400 }}>
                Your AI guide to the Celo blockchain. Ask anything — smart contracts, wallets, cUSD, MiniPay, DeFi.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                {EXAMPLES.slice(0, 4).map((q, i) => (
                  <button key={i}
                    onClick={() => { setInput(q); setShowHero(false); setTimeout(() => inputRef.current?.focus(), 100) }}
                    style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#818cf8"; e.currentTarget.style.borderColor = "rgba(129,140,248,0.3)" }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(232,228,220,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setShowHero(false); setTimeout(() => inputRef.current?.focus(), 100) }}
                style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8e4dc", background: "rgba(79,70,229,0.7)", border: "none", padding: "14px 32px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Start asking →
              </button>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 800, width: "100%", margin: "0 auto", padding: "0 20px", paddingTop: showHero ? 0 : 100, paddingBottom: 180 }}>
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}
          >
            <div style={{ fontSize: 9, fontWeight: 300, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6, color: msg.role === "user" ? "rgba(129,140,248,0.5)" : "rgba(232,228,220,0.2)" }}>
              {msg.role === "user" ? "You" : msg.role === "system" ? "System" : "TeachAgent"}
            </div>
            <div style={{
              maxWidth: "88%", padding: "14px 18px",
              background: msg.role === "user" ? "rgba(79,70,229,0.15)" : msg.role === "system" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${msg.role === "user" ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.06)"}`,
              wordBreak: "break-word",
            }}>
              {msg.role === "agent"
                ? <AgentMessage text={msg.text} />
                : <span style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.8, whiteSpace: "pre-wrap", color: msg.role === "user" ? "#c7d2fe" : "rgba(232,228,220,0.4)" }}>{msg.text}</span>
              }
            </div>
            {msg.txHash && (
              <a href={`https://celoscan.io/tx/${msg.txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, color: "rgba(129,140,248,0.4)", marginTop: 4, textDecoration: "none", letterSpacing: "0.1em" }}>
                View on Celoscan →
              </a>
            )}
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 300, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.2)", marginBottom: 6 }}>TeachAgent</div>
            <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "inline-block" }}>
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontSize: 12, fontWeight: 300, color: "#818cf8" }}>
                {status || "Thinking..."}
              </motion.span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "rgba(8,8,8,0.96)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {!isConnected && (
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.35)" }}>Connect wallet to chat — 0.001 CELO per question</span>
              <button onClick={() => open()} style={{ fontSize: 10, color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.15em" }}>
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
              style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", color: "#e8e4dc", fontSize: 14, fontWeight: 300, fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.5, minHeight: 46, maxHeight: 120, transition: "border-color 0.2s" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(129,140,248,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !isConnected}
              style={{ flexShrink: 0, fontSize: 10, fontWeight: 300, letterSpacing: "0.18em", textTransform: "uppercase", color: "#e8e4dc", background: loading || !input.trim() || !isConnected ? "rgba(79,70,229,0.25)" : "rgba(79,70,229,0.7)", border: "none", padding: "12px 20px", cursor: loading || !input.trim() || !isConnected ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", minHeight: 46 }}
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