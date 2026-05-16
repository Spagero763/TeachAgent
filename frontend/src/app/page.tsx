"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { Logo } from "@/components/Logo"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import Link from "next/link"

const AGENT_URL = "https://teachagent.onrender.com"
const TEACH_AGENT_CONTRACT = "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA"
const PAY_SELECTOR = "0x2567b851"
const PAYMENT_VALUE = ethers.utils.parseEther("0.001")
// cUSD on Celo Mainnet — used for MiniPay payments (MiniPay drops `value` in CIP-64 txns)
const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"

const EXAMPLES = [
  "What is the Celo blockchain?",
  "How does cUSD stay stable?",
  "How do I deploy a smart contract on Celo?",
  "What is MiniPay?",
]

// Deterministic node positions to avoid hydration mismatch
const BG_NODES = [
  { x: 8,  y: 12, s: 5,  d: 0,   dur: 9  },
  { x: 22, y: 30, s: 3,  d: 1.2, dur: 11 },
  { x: 45, y: 8,  s: 7,  d: 0.5, dur: 8  },
  { x: 68, y: 22, s: 4,  d: 2.1, dur: 13 },
  { x: 82, y: 55, s: 6,  d: 0.8, dur: 10 },
  { x: 15, y: 65, s: 3,  d: 1.7, dur: 12 },
  { x: 55, y: 75, s: 5,  d: 0.3, dur: 9  },
  { x: 90, y: 10, s: 4,  d: 2.5, dur: 14 },
  { x: 35, y: 88, s: 6,  d: 1.0, dur: 11 },
  { x: 73, y: 80, s: 3,  d: 1.5, dur: 8  },
  { x: 50, y: 45, s: 4,  d: 3.0, dur: 15 },
  { x: 92, y: 40, s: 5,  d: 0.6, dur: 10 },
]

type Message = {
  role: "user" | "agent" | "system"
  text: string
  txHash?: string
  free?: boolean
  fromHistory?: boolean
  timestamp?: string
}

/* ─── inline markdown renderer ─── */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/[^\s)\]>,"']+)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ fontWeight: 700, color: "#0F1F16" }}>{p.slice(2, -2)}</strong>
        if (p.startsWith("*") && p.endsWith("*"))
          return <em key={i} style={{ color: "#1B8A4F" }}>{p.slice(1, -1)}</em>
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} style={{ background: "rgba(53,208,127,0.1)", padding: "1px 6px", fontFamily: "monospace", fontSize: 12, color: "#1B8A4F", borderRadius: 4, border: "1px solid rgba(53,208,127,0.2)" }}>{p.slice(1, -1)}</code>
        if (p.startsWith("http://") || p.startsWith("https://"))
          return <a key={i} href={p} target="_blank" rel="noopener noreferrer" style={{ color: "#1B8A4F", textDecoration: "underline", textDecorationColor: "rgba(27,138,79,0.4)", textUnderlineOffset: 2, wordBreak: "break-all", transition: "color 0.15s" }} onMouseEnter={e => (e.currentTarget.style.color = "#35D07F")} onMouseLeave={e => (e.currentTarget.style.color = "#1B8A4F")}>{p}</a>
        return <span key={i}>{p}</span>
      })}
    </>
  )
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
            <pre key={pi} style={{ background: "#F0F4F1", border: "1px solid #D4E8DB", padding: "12px 16px", fontSize: 12.5, lineHeight: 1.75, overflow: "auto", fontFamily: "'JetBrains Mono', 'Courier New', monospace", marginBottom: 12, borderRadius: 10 }}>
              <code style={{ color: "#1B8A4F" }}>{code}</code>
            </pre>
          )
        }
        if (para.startsWith("# ") || para.startsWith("## ") || para.startsWith("### ")) {
          const level = para.match(/^(#+)/)?.[1].length || 1
          const content = para.replace(/^#+\s*/, "")
          const sizes = [20, 17, 15]
          return <p key={pi} style={{ fontSize: sizes[level - 1] || 14, fontWeight: 700, color: "#0F1F16", marginBottom: 10, marginTop: level === 1 ? 20 : 14 }}>{content}</p>
        }
        const lines = para.split("\n")
        const hasBullets = lines.some(l => l.match(/^[\-\*•]\s/) || l.match(/^\d+\.\s/))
        if (hasBullets) {
          return (
            <div key={pi} style={{ marginBottom: 10 }}>
              {lines.filter(l => l.trim()).map((line, li) => {
                const bullet = line.match(/^[\-\*•]\s(.*)/)
                const numbered = line.match(/^(\d+)\.\s(.*)/)
                if (bullet) return (
                  <div key={li} style={{ display: "flex", gap: 9, marginBottom: 5, alignItems: "flex-start" }}>
                    <span style={{ color: "#35D07F", fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(15,31,22,0.8)" }}>{renderInline(bullet[1])}</span>
                  </div>
                )
                if (numbered) return (
                  <div key={li} style={{ display: "flex", gap: 9, marginBottom: 5 }}>
                    <span style={{ color: "#35D07F", fontSize: 13, fontWeight: 700, minWidth: 18, paddingTop: 1 }}>{numbered[1]}.</span>
                    <span style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(15,31,22,0.8)" }}>{renderInline(numbered[2])}</span>
                  </div>
                )
                return <p key={li} style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(15,31,22,0.8)", marginBottom: 4 }}>{renderInline(line)}</p>
              })}
            </div>
          )
        }
        return <p key={pi} style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(15,31,22,0.82)", marginBottom: 9 }}>{renderInline(para)}</p>
      })}
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.18, ease: "easeInOut" }}
          style={{ width: 7, height: 7, borderRadius: "50%", background: "#35D07F" }}
        />
      ))}
    </div>
  )
}

/* ─── Floating background nodes ─── */
function BackgroundActivity() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {BG_NODES.map((node, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -18, 6, -10, 0],
            x: [0, 8, -6, 4, 0],
            opacity: [0.18, 0.45, 0.2, 0.38, 0.18],
            scale: [1, 1.15, 0.9, 1.1, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: node.dur,
            delay: node.d,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.s,
            height: node.s,
            borderRadius: "50%",
            background: "rgba(53,208,127,0.55)",
          }}
        />
      ))}
      {/* Soft gradient blobs */}
      <div style={{
        position: "absolute", top: "10%", left: "5%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(53,208,127,0.07) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "15%", right: "8%",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(53,208,127,0.06) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(53,208,127,0.04) 0%, transparent 70%)",
      }} />
    </div>
  )
}

/* ─── Main component ─── */
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
  const [freeUsed, setFreeUsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // MiniPay: detect + auto-connect
  useEffect(() => {
    const eth = (window as any).ethereum
    if (eth?.isMiniPay) {
      setIsMiniPay(true)
      eth.request({ method: "eth_requestAccounts" })
        .then((accs: string[]) => { if (accs?.[0]) setMiniPayAddress(accs[0]) })
        .catch(() => {})
    }
  }, [])

  // Load conversation history + free question status when wallet connects
  useEffect(() => {
    const addr = miniPayAddress || address
    if (!addr) return
    fetch(`${AGENT_URL}/agent/history/${addr}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setFreeUsed(!!data.freeUsed)
        if (data.history?.length) {
          const msgs: Message[] = []
          for (const h of data.history) {
            if (h.role === "user") msgs.push({ role: "user", text: h.content, fromHistory: true })
            else if (h.role === "assistant") msgs.push({ role: "agent", text: h.content, fromHistory: true })
          }
          setMessages(msgs)
        }
      })
      .catch(() => {})
  }, [address, miniPayAddress])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const connected = isConnected || !!miniPayAddress
  const currentAddress = miniPayAddress || address

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, { ...msg, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }])
  }, [])

  async function callPay(signerAddr: string, eth: any, wcProvider?: any): Promise<string> {
    if (isMiniPay) {
      // MiniPay converts eth_sendTransaction to CIP-64 and silently strips `value`.
      // Fix: transfer 0.001 cUSD directly to the contract — no `value` field needed.
      const cUSDIface = new ethers.utils.Interface(["function transfer(address,uint256) returns (bool)"])
      const data = cUSDIface.encodeFunctionData("transfer", [TEACH_AGENT_CONTRACT, PAYMENT_VALUE])
      const txHash: string = await eth.request({
        method: "eth_sendTransaction",
        params: [{
          from: signerAddr,
          to: CUSD_ADDRESS,
          data,
          gas: ethers.utils.hexlify(100000),
        }],
      })
      const wp = new ethers.providers.Web3Provider(eth)
      await wp.waitForTransaction(txHash, 1, 90000)
      return txHash
    }
    // Non-MiniPay wallets: native CELO via payForQuestion()
    const wp = new ethers.providers.Web3Provider(wcProvider)
    const contract = new ethers.Contract(
      TEACH_AGENT_CONTRACT,
      ["function payForQuestion() external payable returns (uint256)"],
      wp.getSigner()
    )
    const tx = await contract.payForQuestion({ value: PAYMENT_VALUE, gasLimit: 200000 })
    return (await tx.wait()).transactionHash
  }

  async function handleSend() {
    const q = input.trim()
    if (!q || loading) return
    const eth = typeof window !== "undefined" ? (window as any).ethereum : null
    if (!connected) { open(); return }

    let userAddr = currentAddress
    if (isMiniPay && !userAddr) {
      try { const a: string[] = await eth.request({ method: "eth_requestAccounts" }); userAddr = a[0]; setMiniPayAddress(a[0]) }
      catch { return }
    }
    if (!userAddr) return

    setInput("")
    addMessage({ role: "user", text: q })
    setLoading(true)
    setStatus("")

    try {
      const r1 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, studentAddress: userAddr }),
      }).catch(() => null)

      if (!r1) { addMessage({ role: "system", text: "Backend is waking up — wait 30 seconds and try again." }); setLoading(false); return }

      if (r1.status !== 402) {
        const d = await r1.json()
        if (d.freeQuestion) setFreeUsed(true)
        addMessage({ role: "agent", text: d.answer || d.error || "No response", free: !!d.freeQuestion })
        setLoading(false); return
      }

      setStatus(isMiniPay ? "Confirm 0.001 cUSD in MiniPay…" : "Confirm 0.001 CELO in your wallet…")

      let signerAddr = userAddr
      if (!isMiniPay && walletProvider) {
        try {
          const wp = new ethers.providers.Web3Provider(walletProvider as any)
          await wp.send("wallet_switchEthereumChain", [{ chainId: "0xa4ec" }])
          signerAddr = await wp.getSigner().getAddress()
        } catch {}
      } else if (!isMiniPay) {
        addMessage({ role: "system", text: "No wallet provider found. Please reconnect." }); setLoading(false); return
      }

      const txHash = await callPay(signerAddr, eth, walletProvider)
      setStatus("Confirming on Celo…")

      if (!isMiniPay) {
        const prov = new ethers.providers.Web3Provider(walletProvider as any)
        const receipt = await prov.waitForTransaction(txHash, 1, 90000)
        if (!receipt || receipt.status !== 1) throw new Error("Transaction failed. Please try again.")
      }

      setStatus("Getting your answer…")
      const r2 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, studentAddress: signerAddr, txHash }),
      })
      const d2 = await r2.json()
      addMessage({ role: "agent", text: d2.answer || d2.error || "No response", txHash })

    } catch (err: any) {
      const msg = err?.message || ""
      if (err?.code === 4001 || err?.code === "ACTION_REJECTED" || msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled"))
        addMessage({ role: "system", text: "Payment cancelled." })
      else if (msg.includes("insufficient funds") || msg.includes("balance") || msg.includes("ERC20: transfer amount exceeds balance"))
        addMessage({ role: "system", text: isMiniPay
          ? "Not enough cUSD. You need at least 0.001 cUSD in your MiniPay wallet."
          : "Not enough CELO. You need at least 0.001 CELO on Celo Mainnet (Chain ID 42220)." })
      else
        addMessage({ role: "system", text: `Something went wrong: ${msg || "Unknown error"}. Please try again.` })
    } finally {
      setLoading(false); setStatus(""); inputRef.current?.focus()
    }
  }

  return (
    <div style={{ background: "#F0F4F1", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

      <BackgroundActivity />
      <Navbar />

      {/* ── Free question banner ── */}
      <AnimatePresence>
        {connected && !freeUsed && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", top: 56, left: 0, right: 0, zIndex: 90,
              background: "#EBF9F2", borderBottom: "1px solid #B6EDCF",
              padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1B8A4F" }}>Your first question is free</span>
            <span style={{ fontSize: 12, color: "rgba(27,138,79,0.6)" }}>— no payment needed</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Welcome screen ── */}
      <AnimatePresence>
        {messages.length === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "relative", zIndex: 1,
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "72px 20px 180px", textAlign: "center",
            }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
              style={{ marginBottom: 22 }}
            >
              <Logo size={76} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: "clamp(2rem, 5.5vw, 3rem)", fontWeight: 800, color: "#0F1F16", marginBottom: 12, letterSpacing: "-0.03em", lineHeight: 1.15 }}
            >
              Learn Celo.<br />
              <span style={{ color: "#35D07F" }}>Pay as you go.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: 15, color: "rgba(15,31,22,0.55)", marginBottom: 32, maxWidth: 380, lineHeight: 1.7, fontWeight: 400 }}
            >
              Ask anything about the Celo blockchain — smart contracts, wallets, cUSD, MiniPay, or DeFi.
              Each answer costs <span style={{ color: "#35D07F", fontWeight: 600 }}>0.001 CELO</span>.
            </motion.p>

            {/* Example chips */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520, marginBottom: 40 }}
            >
              {EXAMPLES.map((q, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50) }}
                  style={{
                    fontSize: 13, fontWeight: 500, color: "rgba(15,31,22,0.6)",
                    background: "#fff",
                    border: "1px solid #D4E8DB",
                    padding: "9px 16px", borderRadius: 100, cursor: "pointer",
                    fontFamily: "inherit", transition: "color 0.15s, border-color 0.15s, box-shadow 0.15s",
                    boxShadow: "0 1px 3px rgba(15,31,22,0.06)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#35D07F"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(53,208,127,0.5)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(53,208,127,0.15)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(15,31,22,0.6)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4E8DB"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(15,31,22,0.06)" }}
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 540, marginBottom: 24 }}
            >
              {[
                { n: "1", t: "Connect wallet", d: "MiniPay, MetaMask or Valora" },
                { n: "2", t: "Ask a question", d: "Any Celo topic" },
                { n: "3", t: "Pay & get answer", d: "0.001 CELO onchain" },
              ].map(({ n, t, d }, i) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + i * 0.06 }}
                  style={{
                    flex: "1 1 140px", minWidth: 130, padding: "14px 16px",
                    background: "#fff",
                    border: "1px solid #E2EAE5",
                    borderRadius: 14, textAlign: "left",
                    boxShadow: "0 1px 4px rgba(15,31,22,0.06)",
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: "#EBF9F2", border: "1px solid #B6EDCF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#35D07F", marginBottom: 10 }}>{n}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1F16", marginBottom: 3 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "rgba(15,31,22,0.45)", lineHeight: 1.5 }}>{d}</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Link href="/stats" style={{ fontSize: 13, color: "rgba(53,208,127,0.7)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#35D07F")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(53,208,127,0.7)")}
              >
                View live stats →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat messages ── */}
      {messages.length > 0 && (
        <div style={{
          position: "relative", zIndex: 1,
          flex: 1, maxWidth: 720, width: "100%", margin: "0 auto",
          padding: "72px 16px 170px",
        }}>
          {/* Previous session divider */}
          {messages.some(m => m.fromHistory) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "#E2EAE5" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,31,22,0.35)", whiteSpace: "nowrap" }}>Previous session</span>
              <div style={{ flex: 1, height: 1, background: "#E2EAE5" }} />
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              style={{
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role !== "user" && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  {msg.role === "agent" && <Logo size={22} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: msg.role === "agent" ? "#35D07F" : "#B87A00" }}>
                    {msg.role === "agent" ? "TeachAgent" : "Notice"}
                  </span>
                  {msg.free && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1B8A4F", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 6, padding: "1px 6px" }}>
                      FREE
                    </span>
                  )}
                </div>
              )}

              <div style={{
                maxWidth: "82%", padding: "11px 15px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #35D07F 0%, #25A062 100%)"
                  : msg.role === "system"
                  ? "#FFFBEB"
                  : "#fff",
                border: msg.role === "user"
                  ? "none"
                  : msg.role === "system"
                  ? "1px solid #FDE68A"
                  : "1px solid #E2EAE5",
                boxShadow: msg.role === "user"
                  ? "0 4px 16px rgba(53,208,127,0.25)"
                  : "0 1px 4px rgba(15,31,22,0.06)",
                wordBreak: "break-word",
              }}>
                {msg.role === "agent"
                  ? <AgentMessage text={msg.text} />
                  : <span style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: msg.role === "user" ? "#fff" : "#92630A", fontWeight: msg.role === "user" ? 500 : 400 }}>{msg.text}</span>
                }
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                {msg.timestamp && (
                  <span style={{ fontSize: 10, color: "rgba(15,31,22,0.3)", fontWeight: 400 }}>{msg.timestamp}</span>
                )}
                {msg.txHash && (
                  <a href={`https://celoscan.io/tx/${msg.txHash}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "rgba(53,208,127,0.6)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#35D07F")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(53,208,127,0.6)")}
                  >
                    ↗ View on Celoscan
                  </a>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing / loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <Logo size={22} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#35D07F" }}>TeachAgent</span>
              </div>
              <div style={{ padding: "10px 16px", background: "#fff", border: "1px solid #E2EAE5", borderRadius: "4px 18px 18px 18px", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 1px 4px rgba(15,31,22,0.06)" }}>
                <TypingDots />
                {status && <span style={{ fontSize: 12, color: "rgba(15,31,22,0.4)", marginLeft: 2 }}>{status}</span>}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid #E2EAE5",
        padding: "10px 16px 14px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Connect prompt */}
          <AnimatePresence>
            {!connected && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                style={{ marginBottom: 8, padding: "10px 14px", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ fontSize: 13, color: "rgba(15,31,22,0.55)" }}>Connect a wallet to start — 0.001 CELO per answer</span>
                <button onClick={() => open()} style={{ fontSize: 13, fontWeight: 700, color: "#35D07F", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Connect →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
                flex: 1,
                background: "#fff",
                border: "1.5px solid #D4E8DB",
                borderRadius: 14, padding: "11px 16px",
                color: "#0F1F16", fontSize: 14, fontFamily: "inherit",
                outline: "none", resize: "none", lineHeight: 1.55,
                minHeight: 46, maxHeight: 130, transition: "border-color 0.2s",
                boxShadow: "0 1px 3px rgba(15,31,22,0.05)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#35D07F")}
              onBlur={e => (e.currentTarget.style.borderColor = "#D4E8DB")}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleSend}
              disabled={loading || !input.trim() || !connected}
              style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: 14,
                background: loading || !input.trim() || !connected
                  ? "#EBF9F2"
                  : "linear-gradient(135deg, #35D07F 0%, #25A062 100%)",
                border: "none", cursor: loading || !input.trim() || !connected ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: !loading && input.trim() && connected ? "0 4px 14px rgba(53,208,127,0.3)" : "none",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={loading || !input.trim() || !connected ? "#B6EDCF" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={loading || !input.trim() || !connected ? "#B6EDCF" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
          </div>

          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "rgba(15,31,22,0.3)" }}>Enter to send · Shift+Enter for new line</span>
            <span style={{ fontSize: 11, color: "#35D07F", fontWeight: 600 }}>
              {isMiniPay ? "0.001 cUSD / answer" : "0.001 CELO / answer"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
