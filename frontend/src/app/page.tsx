"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import dynamic from "next/dynamic"

const AgentCanvas = dynamic(
  () => import("@/components/AgentCanvas").then(m => ({ default: m.AgentCanvas })),
  { ssr: false }
)

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

const T = {
  label: {
    fontSize: 10, fontWeight: 300, letterSpacing: "0.28em",
    textTransform: "uppercase" as const, color: "rgba(232,228,220,0.25)",
  },
  accent: {
    fontSize: 10, fontWeight: 300, letterSpacing: "0.22em",
    textTransform: "uppercase" as const, color: "#818cf8",
  },
  divider: { borderTop: "1px solid rgba(255,255,255,0.05)" },
}

const AGENT_URL = "https://teachagent.onrender.com"
const CUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a"

const CUSD_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
]

const EXAMPLES = [
  "What is the Celo blockchain?",
  "How does cUSD work?",
  "How do I deploy a smart contract on Celo?",
  "What is MiniPay?",
  "How do I get CELO tokens?",
  "What wallets support Celo?",
]

type Message = { role: "user" | "agent"; text: string }

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const canvasOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [payStatus, setPayStatus] = useState("")

  function addMessage(msg: Message) {
    setMessages(prev => [...prev, msg])
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  async function handleSend() {
    if (!input.trim() || loading) return

    if (!isConnected || !address) {
      open()
      return
    }

    const question = input.trim()
    setInput("")
    addMessage({ role: "user", text: question })
    setLoading(true)
    setPayStatus("")

    try {
      // Step 1 — check if payment needed
      const r1 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          courseTitle: "Celo Blockchain",
          tutorAddress: address,
          studentAddress: address,
        }),
      })

      if (r1.status !== 402) {
        const d = await r1.json()
        addMessage({ role: "agent", text: d.answer || d.error || "No response" })
        setLoading(false)
        return
      }

      const payData = await r1.json()

      // Step 2 — trigger MetaMask payment directly
      if (!walletProvider) {
        addMessage({ role: "agent", text: "No wallet provider found. Please reconnect your wallet." })
        setLoading(false)
        return
      }

      setPayStatus("Confirm 0.0001 cUSD payment in your wallet...")

      const web3Provider = new ethers.providers.Web3Provider(walletProvider as any)
      const signer = web3Provider.getSigner()

      const cusd = new ethers.Contract(CUSD, CUSD_ABI, signer)

      const balance = await cusd.balanceOf(address)
      const cost = ethers.utils.parseEther("0.0001")

      if (balance.lt(cost)) {
        addMessage({ role: "agent", text: "Insufficient cUSD balance. You need at least 0.0001 cUSD on Celo mainnet." })
        setLoading(false)
        setPayStatus("")
        return
      }

      const tx = await cusd.transfer(payData.payTo, cost)
      setPayStatus("Confirming transaction...")
      const receipt = await tx.wait()

      setPayStatus("Getting answer...")

      // Step 3 — send with txHash
      const r2 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          courseTitle: "Celo Blockchain",
          tutorAddress: address,
          studentAddress: address,
          txHash: receipt.transactionHash,
        }),
      })

      const d2 = await r2.json()
      addMessage({ role: "agent", text: d2.answer || d2.error || "No response" })
    } catch (err: any) {
      if (err?.code === 4001) {
        addMessage({ role: "agent", text: "Payment cancelled. Your question was not sent." })
      } else {
        addMessage({ role: "agent", text: `Error: ${err?.message || "Unknown error"}` })
      }
    } finally {
      setLoading(false)
      setPayStatus("")
    }
  }

  return (
    <div style={{ background: "#080808", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <motion.div style={{ position: "absolute", right: "-5%", top: 0, width: "55%", height: "100%", opacity: canvasOpacity, zIndex: 0 }}>
          <AgentCanvas />
        </motion.div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #080808 35%, rgba(8,8,8,0.7) 60%, transparent 100%)", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: "10%", top: "20%", width: 500, height: 500, background: "radial-gradient(ellipse, rgba(79,70,229,0.07) 0%, transparent 70%)", zIndex: 1, pointerEvents: "none" }} />

        <motion.div style={{ position: "absolute", left: 60, bottom: 80, zIndex: 2, y: textY, opacity: textOpacity, maxWidth: 600 }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ ...T.accent, marginBottom: 32 }}>
            AI Agent · Celo Blockchain · 0.0001 cUSD per question
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: "clamp(4rem, 9vw, 8rem)", fontWeight: 100, letterSpacing: "-0.03em", lineHeight: 0.92, color: "#e8e4dc", textTransform: "uppercase", marginBottom: 32 }}
          >
            Teach<br />
            <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.6)", color: "transparent" }}>Agent</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            style={{ fontSize: 14, fontWeight: 300, color: "rgba(232,228,220,0.4)", lineHeight: 1.9, maxWidth: 380, marginBottom: 48 }}
          >
            Your AI guide to the Celo blockchain. Ask anything — smart contracts, wallets, cUSD, MiniPay, DeFi. Every answer costs 0.0001 cUSD.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} style={{ display: "flex", gap: 16 }}>
            <a href="#chat" style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8e4dc", background: "rgba(79,70,229,0.7)", padding: "14px 32px", textDecoration: "none" }}>
              Start chatting
            </a>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ position: "absolute", bottom: 40, right: 60, zIndex: 2, display: "flex", alignItems: "center", gap: 16 }}
        >
          <span style={{ ...T.label, writingMode: "vertical-rl" }}>Scroll to chat</span>
          <motion.div animate={{ scaleY: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
            style={{ width: 1, height: 48, background: "linear-gradient(to bottom, rgba(129,140,248,0.4), transparent)", transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ── CHAT ── */}
      <section id="chat" style={{ ...T.divider, padding: "100px 60px 140px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 64 }}>
              <div>
                <p style={{ ...T.label, marginBottom: 16 }}>Ask TeachAgent</p>
                <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 100, letterSpacing: "-0.025em", color: "#e8e4dc", textTransform: "uppercase", lineHeight: 1 }}>
                  Everything about<br />
                  <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.5)", color: "transparent" }}>Celo.</span>
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ ...T.accent, marginBottom: 8 }}>0.0001 cUSD</div>
                <div style={{ ...T.label }}>per question</div>
              </div>
            </div>
          </Reveal>

          {/* Example questions */}
          {messages.length === 0 && (
            <Reveal delay={0.1}>
              <div style={{ marginBottom: 48 }}>
                <div style={{ ...T.label, marginBottom: 20 }}>Example questions — click to ask</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {EXAMPLES.map((q, i) => (
                    <button key={i} onClick={() => setInput(q)}
                      style={{ textAlign: "left", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px 20px", fontSize: 12, fontWeight: 300, color: "rgba(232,228,220,0.4)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,70,229,0.08)"; e.currentTarget.style.color = "#818cf8" }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.color = "rgba(232,228,220,0.4)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    marginBottom: 32,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{ ...T.label, marginBottom: 8, color: msg.role === "user" ? "rgba(129,140,248,0.5)" : "rgba(232,228,220,0.2)" }}>
                    {msg.role === "user" ? "You" : "TeachAgent"}
                  </div>
                  <div style={{
                    maxWidth: "80%",
                    padding: "16px 20px",
                    background: msg.role === "user" ? "rgba(79,70,229,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${msg.role === "user" ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.05)"}`,
                    fontSize: 14,
                    fontWeight: 300,
                    color: msg.role === "user" ? "#c7d2fe" : "rgba(232,228,220,0.7)",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 32 }}>
                  <div style={{ ...T.label, marginBottom: 8 }}>TeachAgent</div>
                  <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "inline-block" }}>
                    <div style={{ fontSize: 12, fontWeight: 300, color: "#818cf8" }}>
                      {payStatus || "Thinking..."}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Input */}
          <Reveal delay={0.2}>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32 }}>
              {!isConnected && (
                <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(79,70,229,0.06)", border: "1px solid rgba(129,140,248,0.15)" }}>
                  <span style={{ fontSize: 12, fontWeight: 300, color: "rgba(232,228,220,0.4)" }}>
                    Connect your wallet to start — each question costs 0.0001 cUSD. 
                  </span>
                  <button onClick={() => open()} style={{ marginLeft: 12, fontSize: 10, color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                    Connect →
                  </button>
                </div>
              )}
              <div style={{ display: "flex", gap: 16 }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Ask anything about Celo..."
                  rows={3}
                  style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "14px 0", color: "#e8e4dc", fontSize: 14, fontWeight: 300, fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.7 }}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(129,140,248,0.5)")}
                  onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  style={{ alignSelf: "flex-end", fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8e4dc", background: loading ? "rgba(79,70,229,0.3)" : "rgba(79,70,229,0.7)", border: "none", padding: "14px 28px", cursor: loading ? "default" : "pointer", fontFamily: "inherit", opacity: !input.trim() ? 0.4 : 1, whiteSpace: "nowrap" }}
                >
                  {loading ? "..." : !isConnected ? "Connect" : "Send — 0.0001 cUSD"}
                </button>
              </div>
              <div style={{ ...T.label, marginTop: 12 }}>
                Press Enter to send · Shift+Enter for new line · Payment triggers automatically
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section style={{ ...T.divider, padding: "100px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {[
                { step: "01", title: "Connect wallet", desc: "Connect MetaMask, Valora, or MiniPay. Any Celo-compatible wallet works." },
                { step: "02", title: "Ask your question", desc: "Type anything about Celo — smart contracts, wallets, cUSD, DeFi, or MiniPay." },
                { step: "03", title: "Pay & get answer", desc: "Your wallet prompts automatically. Pay 0.0001 cUSD and get an instant AI answer." },
              ].map((item, i) => (
                <div key={i} style={{ padding: "48px 48px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ ...T.accent, marginBottom: 24 }}>{item.step}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 200, color: "#e8e4dc", letterSpacing: "-0.01em", marginBottom: 14, textTransform: "uppercase" }}>{item.title}</h3>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.38)", lineHeight: 1.9 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ ...T.divider, padding: "80px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
              {[
                { v: "0.0001", l: "cUSD per question" },
                { v: "Llama 3.3", l: "AI model" },
                { v: "Celo", l: "Network" },
                { v: "Instant", l: "Answers" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "36px 40px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ fontSize: 26, fontWeight: 100, color: "#818cf8", marginBottom: 10 }}>{s.v}</div>
                  <div style={{ ...T.label }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ ...T.divider, padding: "32px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...T.label }}>TeachAgent · 2026</span>
          <div style={{ display: "flex", gap: 48 }}>
            {[
              { label: "GitHub", href: "https://github.com/Spagero763/TeachAgent" },
              { label: "API", href: AGENT_URL },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                style={{ ...T.label, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e8e4dc")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,228,220,0.25)")}
              >
                {l.label}
              </a>
            ))}
          </div>
          <span style={{ ...T.label }}>Celo Mainnet</span>
        </div>
      </footer>
    </div>
  )
}