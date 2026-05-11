"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import Link from "next/link"

const AGENT_URL = "https://teachagent.onrender.com"
const TEACH_AGENT_CONTRACT = "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA"
const PAY_SELECTOR = "0x2567b851"
const PAYMENT_VALUE = ethers.utils.parseEther("0.001")

const EXAMPLES = [
  "What is the Celo blockchain?",
  "How does cUSD stay stable?",
  "How do I deploy a smart contract on Celo?",
  "What is MiniPay?",
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
            <pre key={pi} style={{ background: "#F0F4F1", border: "1px solid #D4E8DB", padding: "10px 14px", fontSize: 12, lineHeight: 1.7, overflow: "auto", fontFamily: "monospace", marginBottom: 10, borderRadius: 8 }}>
              <code style={{ color: "#1A7A4A" }}>{code}</code>
            </pre>
          )
        }
        if (para.startsWith("### ")) return <h4 key={pi} style={{ fontSize: 14, fontWeight: 700, color: "#0F1F16", marginBottom: 6, marginTop: 12 }}>{para.replace(/^###\s*/, "")}</h4>
        if (para.startsWith("## ")) return <h3 key={pi} style={{ fontSize: 15, fontWeight: 700, color: "#0F1F16", marginBottom: 8, marginTop: 16 }}>{para.replace(/^##\s*/, "")}</h3>
        if (para.startsWith("# ")) return <h2 key={pi} style={{ fontSize: 17, fontWeight: 800, color: "#0F1F16", marginBottom: 10, marginTop: 20 }}>{para.replace(/^#\s*/, "")}</h2>
        const lines = para.split("\n")
        const hasBullets = lines.some(l => l.match(/^[\-\*•]\s/) || l.match(/^\d+\.\s/))
        if (hasBullets) {
          return (
            <div key={pi} style={{ marginBottom: 8 }}>
              {lines.filter(l => l.trim()).map((line, li) => {
                const bullet = line.match(/^[\-\*•]\s(.*)/)
                const numbered = line.match(/^(\d+)\.\s(.*)/)
                if (bullet) return (
                  <div key={li} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: "#35D07F", flexShrink: 0, fontSize: 18, lineHeight: "1.5" }}>•</span>
                    <span style={{ fontSize: 14, lineHeight: 1.65, color: "#2D4A38" }}>{renderInline(bullet[1])}</span>
                  </div>
                )
                if (numbered) return (
                  <div key={li} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: "#35D07F", flexShrink: 0, fontSize: 13, fontWeight: 700, minWidth: 18 }}>{numbered[1]}.</span>
                    <span style={{ fontSize: 14, lineHeight: 1.65, color: "#2D4A38" }}>{renderInline(numbered[2])}</span>
                  </div>
                )
                return <p key={li} style={{ fontSize: 14, lineHeight: 1.65, color: "#2D4A38", marginBottom: 3 }}>{renderInline(line)}</p>
              })}
            </div>
          )
        }
        return <p key={pi} style={{ fontSize: 14, lineHeight: 1.7, color: "#2D4A38", marginBottom: 8 }}>{renderInline(para)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} style={{ fontWeight: 700, color: "#0F1F16" }}>{part.slice(2, -2)}</strong>
        if (part.startsWith("*") && part.endsWith("*")) return <em key={i} style={{ color: "#1A7A4A" }}>{part.slice(1, -1)}</em>
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i} style={{ background: "#EBF9F2", padding: "1px 6px", fontFamily: "monospace", fontSize: 12, color: "#1A7A4A", borderRadius: 4, border: "1px solid #C8EDD8" }}>{part.slice(1, -1)}</code>
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
  const [isMiniPay, setIsMiniPay] = useState(false)
  const [miniPayAddress, setMiniPayAddress] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Detect MiniPay and auto-connect
  useEffect(() => {
    const eth = (window as any).ethereum
    if (eth?.isMiniPay) {
      setIsMiniPay(true)
      eth.request({ method: "eth_requestAccounts" })
        .then((accounts: string[]) => {
          if (accounts?.[0]) setMiniPayAddress(accounts[0])
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const connected = isConnected || !!miniPayAddress
  const currentAddress = miniPayAddress || address

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg])
  }, [])

  async function callPayForQuestion(signerAddress: string, eth: any, wcProvider?: any): Promise<string> {
    if (isMiniPay) {
      const wp = new ethers.providers.Web3Provider(eth)
      const signer = wp.getSigner()
      const tx = await signer.sendTransaction({
        to: TEACH_AGENT_CONTRACT,
        value: PAYMENT_VALUE,
        data: PAY_SELECTOR,
      })
      const receipt = await tx.wait()
      return receipt.transactionHash
    }
    const web3Provider = new ethers.providers.Web3Provider(wcProvider)
    const signer = web3Provider.getSigner()
    const contract = new ethers.Contract(
      TEACH_AGENT_CONTRACT,
      ["function payForQuestion() external payable returns (uint256)"],
      signer
    )
    const tx = await contract.payForQuestion({ value: PAYMENT_VALUE, gasLimit: 200000 })
    const receipt = await tx.wait()
    return receipt.transactionHash
  }

  async function handleSend() {
    const q = input.trim()
    if (!q || loading) return

    const eth = typeof window !== "undefined" ? (window as any).ethereum : null

    if (!connected) { open(); return }

    let userAddress = currentAddress
    if (isMiniPay && !userAddress) {
      try {
        const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
        userAddress = accounts[0]
        setMiniPayAddress(accounts[0])
      } catch { return }
    }
    if (!userAddress) return

    setInput("")
    addMessage({ role: "user", text: q })
    setLoading(true)
    setStatus("")

    try {
      const r1 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, studentAddress: userAddress }),
      }).catch(() => null)

      if (!r1) {
        addMessage({ role: "system", text: "Backend is waking up — please wait 30 seconds and try again." })
        setLoading(false)
        return
      }

      if (r1.status !== 402) {
        const d = await r1.json()
        addMessage({ role: "agent", text: d.answer || d.error || "No response" })
        setLoading(false)
        return
      }

      setStatus("Confirm 0.001 CELO in your wallet…")

      let signerAddress = userAddress
      if (!isMiniPay && walletProvider) {
        try {
          const wp = new ethers.providers.Web3Provider(walletProvider as any)
          await wp.send("wallet_switchEthereumChain", [{ chainId: "0xa4ec" }])
          signerAddress = await wp.getSigner().getAddress()
        } catch {}
      } else if (!isMiniPay) {
        addMessage({ role: "system", text: "No wallet provider found. Please reconnect." })
        setLoading(false)
        return
      }

      const txHash = await callPayForQuestion(signerAddress, eth, walletProvider)
      setStatus("Confirming on Celo…")

      const provider = isMiniPay
        ? new ethers.providers.Web3Provider(eth)
        : new ethers.providers.Web3Provider(walletProvider as any)

      const receipt = await provider.waitForTransaction(txHash, 1, 90000)
      if (!receipt || receipt.status !== 1) throw new Error("Transaction failed. Please try again.")

      setStatus("Getting your answer…")

      const r2 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, studentAddress: signerAddress, txHash }),
      })
      const d2 = await r2.json()
      addMessage({ role: "agent", text: d2.answer || d2.error || "No response", txHash })

    } catch (err: any) {
      const msg = err?.message || ""
      if (err?.code === 4001 || err?.code === "ACTION_REJECTED" || msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled")) {
        addMessage({ role: "system", text: "Payment cancelled." })
      } else if (msg.includes("insufficient funds") || msg.includes("balance")) {
        addMessage({ role: "system", text: "Not enough CELO. You need at least 0.001 CELO on Celo Mainnet (Chain ID 42220).\n\nGet CELO on Binance or Coinbase, then send to your wallet." })
      } else {
        addMessage({ role: "system", text: `Something went wrong: ${msg || "Unknown error"}. Please try again.` })
      }
    } finally {
      setLoading(false)
      setStatus("")
      inputRef.current?.focus()
    }
  }

  const showWelcome = messages.length === 0

  return (
    <div style={{ background: "#F0F4F1", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Welcome screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "72px 20px 160px", textAlign: "center",
            }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              style={{
                width: 80, height: 80, borderRadius: 24,
                background: "#35D07F",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 20,
              }}
            >T</motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ fontSize: "clamp(1.7rem, 5vw, 2.4rem)", fontWeight: 800, color: "#0F1F16", marginBottom: 10, letterSpacing: "-0.025em", lineHeight: 1.2 }}
            >
              Learn Celo.<br />Pay as you go.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ fontSize: 15, color: "#6B7C72", marginBottom: 28, maxWidth: 360, lineHeight: 1.6 }}
            >
              Ask anything about the Celo blockchain — smart contracts, wallets, cUSD, MiniPay, DeFi.
              Each answer costs <strong style={{ color: "#1A7A4A" }}>0.001 CELO</strong>.
            </motion.p>

            {/* Example chips */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480, marginBottom: 32 }}
            >
              {EXAMPLES.map((q, i) => (
                <button key={i}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50) }}
                  style={{
                    fontSize: 13, fontWeight: 500, color: "#2D4A38",
                    background: "#fff", border: "1.5px solid #D4E8DB",
                    padding: "8px 16px", borderRadius: 100, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#35D07F"; e.currentTarget.style.color = "#1A7A4A"; e.currentTarget.style.background = "#EBF9F2" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#D4E8DB"; e.currentTarget.style.color = "#2D4A38"; e.currentTarget.style.background = "#fff" }}
                >
                  {q}
                </button>
              ))}
            </motion.div>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 520, marginBottom: 20 }}
            >
              {[
                { n: "1", t: "Connect wallet", d: "MiniPay, MetaMask or Valora" },
                { n: "2", t: "Ask a question", d: "Any Celo topic" },
                { n: "3", t: "Pay & receive answer", d: "0.001 CELO onchain" },
              ].map(({ n, t, d }) => (
                <div key={n} style={{
                  flex: "1 1 140px", minWidth: 130, padding: "12px 14px",
                  background: "#fff", border: "1.5px solid #E2EAE5",
                  borderRadius: 12, textAlign: "left",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: "#EBF9F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#35D07F", marginBottom: 8 }}>{n}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1F16", marginBottom: 2 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#8FA897", lineHeight: 1.4 }}>{d}</div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <Link href="/stats" style={{ fontSize: 13, color: "#8FA897", textDecoration: "none", fontWeight: 500 }}>
                View live stats →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat messages */}
      {messages.length > 0 && (
        <div style={{
          flex: 1, maxWidth: 700, width: "100%", margin: "0 auto",
          padding: "72px 16px 160px",
        }}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              style={{
                marginBottom: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role !== "user" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {msg.role === "agent" && (
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: "#35D07F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>T</div>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 600, color: msg.role === "agent" ? "#1A7A4A" : "#C4853A" }}>
                    {msg.role === "agent" ? "TeachAgent" : "Notice"}
                  </span>
                </div>
              )}

              <div style={{
                maxWidth: "82%", padding: "10px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                background: msg.role === "user" ? "#35D07F"
                  : msg.role === "system" ? "#FFF8EC"
                  : "#fff",
                border: msg.role === "user" ? "none"
                  : msg.role === "system" ? "1.5px solid #F5D89A"
                  : "1.5px solid #E2EAE5",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                wordBreak: "break-word",
              }}>
                {msg.role === "agent"
                  ? <AgentMessage text={msg.text} />
                  : <span style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", color: msg.role === "user" ? "#fff" : "#9A6820", fontWeight: msg.role === "user" ? 500 : 400 }}>{msg.text}</span>
                }
              </div>

              {msg.txHash && (
                <a href={`https://celoscan.io/tx/${msg.txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#8FA897", marginTop: 3, textDecoration: "none", fontWeight: 500 }}>
                  ↗ View on Celoscan
                </a>
              )}
            </motion.div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: "#35D07F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>T</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1A7A4A" }}>TeachAgent</span>
              </div>
              <div style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid #E2EAE5", borderRadius: "4px 18px 18px 18px", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <TypingDots />
                {status && <span style={{ fontSize: 12, color: "#8FA897", marginLeft: 4 }}>{status}</span>}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "#fff", borderTop: "1.5px solid #E2EAE5",
        padding: "10px 16px 12px",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 8, padding: "10px 14px", background: "#EBF9F2", border: "1.5px solid #B6EDCF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ fontSize: 13, color: "#2D4A38" }}>Connect a wallet to start — 0.001 CELO per answer</span>
              <button onClick={() => open()} style={{ fontSize: 13, fontWeight: 700, color: "#35D07F", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Connect →
              </button>
            </motion.div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={connected ? "Ask anything about Celo…" : "Connect wallet to start…"}
              rows={1}
              disabled={!connected || loading}
              style={{
                flex: 1, background: "#F0F4F1", border: "1.5px solid #D4E8DB",
                borderRadius: 14, padding: "11px 16px", color: "#0F1F16", fontSize: 14,
                fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.5,
                minHeight: 46, maxHeight: 120, transition: "border-color 0.15s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#35D07F")}
              onBlur={e => (e.currentTarget.style.borderColor = "#D4E8DB")}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !connected}
              style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: 14,
                background: loading || !input.trim() || !connected ? "#D4E8DB" : "#35D07F",
                border: "none", cursor: loading || !input.trim() || !connected ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={loading || !input.trim() || !connected ? "#8FA897" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={loading || !input.trim() || !connected ? "#8FA897" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div style={{ marginTop: 5, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#B0C4B8" }}>Enter to send · Shift+Enter for new line</span>
            <span style={{ fontSize: 11, color: "#8FA897", fontWeight: 600 }}>0.001 CELO / answer</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15, ease: "easeInOut" }}
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#35D07F" }}
        />
      ))}
    </div>
  )
}
