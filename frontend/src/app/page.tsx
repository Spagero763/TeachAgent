"use client"

import { useRef, useState, useEffect } from "react"
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
            <pre key={pi} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(53,208,127,0.15)", padding: "12px 16px", fontSize: 12, lineHeight: 1.7, overflow: "auto", fontFamily: "monospace", marginBottom: 12, borderRadius: 6 }}>
              <code style={{ color: "#35D07F" }}>{code}</code>
            </pre>
          )
        }
        if (para.startsWith("### ")) return <h4 key={pi} style={{ fontSize: 14, fontWeight: 600, color: "#E8EDE9", marginBottom: 8, marginTop: 14 }}>{para.replace(/^###\s*/, "")}</h4>
        if (para.startsWith("## ")) return <h3 key={pi} style={{ fontSize: 15, fontWeight: 600, color: "#E8EDE9", marginBottom: 10, marginTop: 18 }}>{para.replace(/^##\s*/, "")}</h3>
        if (para.startsWith("# ")) return <h2 key={pi} style={{ fontSize: 17, fontWeight: 700, color: "#E8EDE9", marginBottom: 12, marginTop: 22 }}>{para.replace(/^#\s*/, "")}</h2>
        const lines = para.split("\n")
        const hasBullets = lines.some(l => l.match(/^[\-\*•]\s/) || l.match(/^\d+\.\s/))
        if (hasBullets) {
          return (
            <div key={pi} style={{ marginBottom: 10 }}>
              {lines.filter(l => l.trim()).map((line, li) => {
                const bullet = line.match(/^[\-\*•]\s(.*)/)
                const numbered = line.match(/^(\d+)\.\s(.*)/)
                if (bullet) return (
                  <div key={li} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                    <span style={{ color: "#35D07F", flexShrink: 0, fontSize: 16, lineHeight: "1.6" }}>·</span>
                    <span style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(232,237,233,0.85)" }}>{renderInline(bullet[1])}</span>
                  </div>
                )
                if (numbered) return (
                  <div key={li} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                    <span style={{ color: "#35D07F", flexShrink: 0, fontSize: 13, fontWeight: 600, minWidth: 18, paddingTop: 1 }}>{numbered[1]}.</span>
                    <span style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(232,237,233,0.85)" }}>{renderInline(numbered[2])}</span>
                  </div>
                )
                return <p key={li} style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(232,237,233,0.85)", marginBottom: 4 }}>{renderInline(line)}</p>
              })}
            </div>
          )
        }
        return <p key={pi} style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(232,237,233,0.85)", marginBottom: 10 }}>{renderInline(para)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} style={{ fontWeight: 600, color: "#E8EDE9" }}>{part.slice(2, -2)}</strong>
        if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i} style={{ background: "rgba(53,208,127,0.1)", padding: "1px 5px", fontFamily: "monospace", fontSize: 12, color: "#35D07F", borderRadius: 3 }}>{part.slice(1, -1)}</code>
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
  const [showWelcome, setShowWelcome] = useState(true)
  const [isMiniPay, setIsMiniPay] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const eth = (window as any).ethereum
    setIsMiniPay(!!eth?.isMiniPay)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  function addMessage(msg: Message) {
    setMessages(prev => [...prev, msg])
  }

  async function callPayForQuestion(signerAddress: string, isMiniPay: boolean, eth: any, wcProvider?: any): Promise<string> {
    if (isMiniPay) {
      const wp = new ethers.providers.Web3Provider(eth)
      const signer = wp.getSigner()
      const tx = await signer.sendTransaction({ to: TEACH_AGENT_CONTRACT, value: PAYMENT_VALUE, data: PAY_SELECTOR })
      const receipt = await tx.wait()
      return receipt.transactionHash
    } else {
      const web3Provider = new ethers.providers.Web3Provider(wcProvider)
      const signer = web3Provider.getSigner()
      const contract = new ethers.Contract(TEACH_AGENT_CONTRACT, ["function payForQuestion() external payable returns (uint256)"], signer)
      const tx = await contract.payForQuestion({ value: PAYMENT_VALUE, gasLimit: 200000 })
      const receipt = await tx.wait()
      return receipt.transactionHash
    }
  }

  async function handleSend() {
    const q = input.trim()
    if (!q || loading) return

    const eth = typeof window !== "undefined" ? (window as any).ethereum : null

    if (!isConnected && !isMiniPay) { open(); return }

    let currentUserAddress = address
    if (isMiniPay && !currentUserAddress) {
      try {
        const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
        currentUserAddress = accounts[0]
      } catch { return }
    }

    if (!currentUserAddress) return

    setShowWelcome(false)
    setInput("")
    addMessage({ role: "user", text: q })
    setLoading(true)
    setStatus("")

    try {
      const r1 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, studentAddress: currentUserAddress }),
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

      setStatus("Confirm 0.001 CELO payment in your wallet…")

      let signerAddress = currentUserAddress
      if (!isMiniPay && walletProvider) {
        try {
          const wp = new ethers.providers.Web3Provider(walletProvider as any)
          await wp.send("wallet_switchEthereumChain", [{ chainId: "0xa4ec" }])
          signerAddress = await wp.getSigner().getAddress()
        } catch {}
      } else if (!isMiniPay) {
        addMessage({ role: "system", text: "No wallet provider found. Please reconnect your wallet." })
        setLoading(false)
        return
      }

      const txHash = await callPayForQuestion(signerAddress, isMiniPay, eth, walletProvider)
      setStatus("Confirming on Celo…")

      const provider = isMiniPay
        ? new ethers.providers.Web3Provider(eth)
        : new ethers.providers.Web3Provider(walletProvider as any)

      const receipt = await provider.waitForTransaction(txHash, 1, 90000)
      if (!receipt || receipt.status !== 1) throw new Error("Transaction failed on Celo. Please try again.")

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
        addMessage({ role: "system", text: "Insufficient CELO balance. You need at least 0.001 CELO on Celo mainnet.\n\nGet CELO on Binance, Coinbase, or any exchange, then send to your wallet on Celo network (Chain ID 42220)." })
      } else {
        addMessage({ role: "system", text: `Something went wrong: ${msg || "Unknown error"}. Please try again.` })
      }
    } finally {
      setLoading(false)
      setStatus("")
      inputRef.current?.focus()
    }
  }

  const connected = isConnected || isMiniPay

  return (
    <div style={{ background: "#0A0F0D", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Welcome screen */}
      <AnimatePresence>
        {showWelcome && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "80px 24px 160px", textAlign: "center",
            }}
          >
            {/* Logo mark */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #35D07F 0%, #FBCC5C 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, fontWeight: 800, color: "#0A0F0D", marginBottom: 24,
                boxShadow: "0 0 40px rgba(53,208,127,0.25)",
              }}
            >T</motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 700, color: "#E8EDE9", marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.15 }}
            >
              Your AI guide to<br />the Celo blockchain
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ fontSize: 15, color: "rgba(232,237,233,0.5)", marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}
            >
              Ask anything about smart contracts, wallets, cUSD, MiniPay, or DeFi on Celo.
              Each answer costs <span style={{ color: "#35D07F", fontWeight: 600 }}>0.001 CELO</span> (~$0.0003).
            </motion.p>

            {/* Example questions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32, maxWidth: 500 }}
            >
              {EXAMPLES.map((q, i) => (
                <button key={i}
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                  style={{
                    fontSize: 13, fontWeight: 400, color: "rgba(232,237,233,0.65)",
                    background: "rgba(53,208,127,0.06)", border: "1px solid rgba(53,208,127,0.15)",
                    padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(53,208,127,0.12)"; e.currentTarget.style.color = "#35D07F"; e.currentTarget.style.borderColor = "rgba(53,208,127,0.35)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(53,208,127,0.06)"; e.currentTarget.style.color = "rgba(232,237,233,0.65)"; e.currentTarget.style.borderColor = "rgba(53,208,127,0.15)" }}
                >
                  {q}
                </button>
              ))}
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 560 }}
            >
              {[
                { n: "1", t: "Connect wallet", d: "MiniPay, MetaMask, or Valora" },
                { n: "2", t: "Ask a question", d: "Type anything about Celo" },
                { n: "3", t: "Pay 0.001 CELO", d: "Onchain — less than $0.001" },
              ].map(({ n, t, d }) => (
                <div key={n} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
                  background: "rgba(53,208,127,0.04)", border: "1px solid rgba(53,208,127,0.1)",
                  borderRadius: 10, flex: "1 1 140px", minWidth: 140, textAlign: "left",
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(53,208,127,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#35D07F", flexShrink: 0 }}>{n}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#E8EDE9", marginBottom: 2 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "rgba(232,237,233,0.4)", lineHeight: 1.4 }}>{d}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ marginTop: 20 }}
            >
              <Link href="/stats" style={{ fontSize: 12, color: "rgba(53,208,127,0.5)", textDecoration: "none" }}>
                View live stats →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat messages */}
      <div style={{
        flex: 1, maxWidth: 720, width: "100%", margin: "0 auto",
        padding: messages.length > 0 ? "80px 16px 160px" : "0 16px",
      }}>
        {messages.map((msg, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* Role label */}
            <div style={{
              fontSize: 11, fontWeight: 500, marginBottom: 4,
              color: msg.role === "user" ? "rgba(53,208,127,0.6)" : "rgba(232,237,233,0.3)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {msg.role === "agent" && (
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg, #35D07F, #FBCC5C)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#0A0F0D" }}>T</span>
              )}
              {msg.role === "user" ? "You" : msg.role === "system" ? "Notice" : "TeachAgent"}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: "85%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, rgba(53,208,127,0.2), rgba(53,208,127,0.1))"
                : msg.role === "system"
                  ? "rgba(251,204,92,0.06)"
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${msg.role === "user" ? "rgba(53,208,127,0.25)" : msg.role === "system" ? "rgba(251,204,92,0.2)" : "rgba(255,255,255,0.07)"}`,
              wordBreak: "break-word",
            }}>
              {msg.role === "agent"
                ? <AgentMessage text={msg.text} />
                : <span style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: msg.role === "user" ? "#E8EDE9" : "rgba(251,204,92,0.8)" }}>{msg.text}</span>
              }
            </div>

            {msg.txHash && (
              <a href={`https://celoscan.io/tx/${msg.txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "rgba(53,208,127,0.4)", marginTop: 4, textDecoration: "none" }}>
                ↗ View on Celoscan
              </a>
            )}
          </motion.div>
        ))}

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 4, color: "rgba(232,237,233,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg, #35D07F, #FBCC5C)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#0A0F0D" }}>T</span>
              TeachAgent
            </div>
            <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px 18px 18px 4px", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ fontSize: 13, color: "#35D07F" }}>
                {status || "Thinking…"}
              </motion.div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(10,15,13,0.97)", backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(53,208,127,0.1)", padding: "12px 16px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {!connected && (
            <div style={{ marginBottom: 10, padding: "10px 14px", background: "rgba(53,208,127,0.06)", border: "1px solid rgba(53,208,127,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "rgba(232,237,233,0.5)" }}>Connect a wallet to start — 0.001 CELO per answer</span>
              <button onClick={() => open()} style={{ fontSize: 13, fontWeight: 600, color: "#35D07F", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Connect →
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={connected ? "Ask anything about Celo…" : "Connect wallet first…"}
              rows={1}
              disabled={!connected || loading}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(53,208,127,0.15)",
                borderRadius: 12, padding: "11px 16px", color: "#E8EDE9", fontSize: 14,
                fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.5,
                minHeight: 44, maxHeight: 120, transition: "border-color 0.2s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(53,208,127,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(53,208,127,0.15)")}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !connected}
              style={{
                flexShrink: 0, width: 44, height: 44, borderRadius: 12,
                background: loading || !input.trim() || !connected ? "rgba(53,208,127,0.15)" : "#35D07F",
                border: "none", cursor: loading || !input.trim() || !connected ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={loading || !input.trim() || !connected ? "rgba(53,208,127,0.4)" : "#0A0F0D"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={loading || !input.trim() || !connected ? "rgba(53,208,127,0.4)" : "#0A0F0D"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(232,237,233,0.2)" }}>Enter to send · Shift+Enter for new line</span>
            <span style={{ fontSize: 11, color: "rgba(53,208,127,0.4)", fontWeight: 500 }}>0.001 CELO / answer</span>
          </div>
        </div>
      </div>
    </div>
  )
}
