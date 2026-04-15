"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import type { Eip1193Provider } from "ethers"
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
  label: { fontSize: 10, fontWeight: 300, letterSpacing: "0.28em", textTransform: "uppercase" as const, color: "rgba(232,228,220,0.25)" },
  accent: { fontSize: 10, fontWeight: 300, letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#818cf8" },
  divider: { borderTop: "1px solid rgba(255,255,255,0.05)" },
}

const AGENT_URL = "https://teachagent.onrender.com"
const AGENT_WALLET = "0x50BcA645b274A152a1C64B6251C0Ac52725BaAc1"
const CUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a"

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const canvasOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [tutorAddr, setTutorAddr] = useState("")
  const [scoring, setScoring] = useState(false)
  const [scoreData, setScoreData] = useState<any>(null)

  const [question, setQuestion] = useState("")
  const [answering, setAnswering] = useState(false)
  const [answer, setAnswer] = useState("")
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [payStatus, setPayStatus] = useState("")

  async function runScore() {
    if (!tutorAddr.trim()) return
    setScoring(true)
    setScoreData(null)
    try {
      const r = await fetch(`${AGENT_URL}/agent/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorAddress: tutorAddr.trim() }),
      })
      setScoreData(await r.json())
    } catch {
      setScoreData({ error: "Could not reach agent." })
    } finally {
      setScoring(false)
    }
  }

  async function askAgent() {
    if (!question.trim()) return
    if (!isConnected || !address) { open(); return }

    setAnswering(true)
    setAnswer("")
    setPaymentRequired(false)
    setPayStatus("")

    try {
      const r1 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          courseTitle: "Blockchain Development on Celo",
          tutorAddress: AGENT_WALLET,
          studentAddress: address,
        }),
      })

      if (r1.status === 402) {
        const data = await r1.json()
        setPaymentInfo(data)
        setPaymentRequired(true)
        setAnswering(false)
        return
      }

      const d = await r1.json()
      setAnswer(d.answer || d.error || "No response")
    } catch {
      setAnswer("Could not reach agent. Try again.")
    } finally {
      setAnswering(false)
    }
  }

  async function payAndAsk() {
    if (!paymentInfo || !walletProvider || !address) return
    setAnswering(true)
    setPayStatus("Sending 0.0001 cUSD...")

    try {
      const web3Provider = new ethers.providers.Web3Provider(walletProvider as Eip1193Provider)
      const signer = web3Provider.getSigner()

      const cusd = new ethers.Contract(
        CUSD,
        [
          "function transfer(address to, uint256 amount) external returns (bool)",
          "function balanceOf(address) external view returns (uint256)",
        ],
        signer
      )

      const balance = await cusd.balanceOf(address)
      const cost = ethers.utils.parseEther("0.0001")

      if (balance.lt(cost)) {
        setAnswer("Insufficient cUSD. You need at least 0.0001 cUSD on Celo.")
        setPaymentRequired(false)
        setAnswering(false)
        return
      }

      setPayStatus("Waiting for wallet confirmation...")
      const tx = await cusd.transfer(paymentInfo.payTo, cost)
      setPayStatus("Confirming transaction...")
      const receipt = await tx.wait()

      setPayStatus("Verifying payment & getting answer...")
      const r2 = await fetch(`${AGENT_URL}/agent/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          courseTitle: "Blockchain Development on Celo",
          tutorAddress: AGENT_WALLET,
          studentAddress: address,
          txHash: receipt.transactionHash,
        }),
      })

      const d = await r2.json()
      setAnswer(d.answer || d.error)
      setPaymentRequired(false)
      setPaymentInfo(null)
      setPayStatus("")
    } catch (err: any) {
      if (err?.code === 4001) {
        setPayStatus("")
        setAnswer("Payment cancelled.")
      } else {
        setAnswer(`Payment failed: ${err?.message || "Unknown error"}`)
      }
    } finally {
      setAnswering(false)
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
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} style={{ ...T.accent, marginBottom: 32 }}>
            AI Agent · Celo Mainnet · Agent ID 1
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: "clamp(4rem, 9vw, 8rem)", fontWeight: 100, letterSpacing: "-0.03em", lineHeight: 0.92, color: "#e8e4dc", textTransform: "uppercase", marginBottom: 32 }}
          >
            Teach<br />
            <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.6)", color: "transparent" }}>Agent</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            style={{ fontSize: 14, fontWeight: 300, color: "rgba(232,228,220,0.4)", lineHeight: 1.9, maxWidth: 380, marginBottom: 48 }}
          >
            Scores educators on Celo using Llama AI. Reputation onchain. Sessions cost 0.0001 cUSD.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} style={{ display: "flex", gap: 16 }}>
            <a href="#score" style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8e4dc", background: "rgba(79,70,229,0.7)", padding: "14px 32px", textDecoration: "none" }}>
              Score educator
            </a>
            <a href="#session" style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,228,220,0.4)", padding: "14px 32px", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
              Ask a question
            </a>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ position: "absolute", bottom: 40, right: 60, zIndex: 2, display: "flex", alignItems: "center", gap: 16 }}
        >
          <span style={{ ...T.label, writingMode: "vertical-rl", letterSpacing: "0.3em" }}>Scroll to explore</span>
          <motion.div
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ width: 1, height: 48, background: "linear-gradient(to bottom, rgba(129,140,248,0.4), transparent)", transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="about" style={{ ...T.divider, padding: "140px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal><p style={{ ...T.label, marginBottom: 80 }}>How it works</p></Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              { step: "01", title: "Read onchain data", desc: "Reads courses, chapters, and earnings from EduPay on Celo mainnet. No forms. No trust required." },
              { step: "02", title: "Score with Llama AI", desc: "Analyzes course quality, depth, and student demand. Returns a 0–100 score with full breakdown." },
              { step: "03", title: "Post reputation onchain", desc: "Score written permanently to AgentRegistry on Celo. Anyone can verify without asking TeachAgent." },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div style={{ padding: "48px 48px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ ...T.accent, marginBottom: 24 }}>{item.step}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 200, color: "#e8e4dc", letterSpacing: "-0.01em", marginBottom: 16, textTransform: "uppercase" }}>{item.title}</h3>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.38)", lineHeight: 1.9 }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORE ── */}
      <section id="score" style={{ ...T.divider, padding: "140px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 120, alignItems: "start" }}>
          <Reveal>
            <p style={{ ...T.label, marginBottom: 32 }}>Score an educator</p>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 100, letterSpacing: "-0.025em", lineHeight: 1.0, color: "#e8e4dc", textTransform: "uppercase", marginBottom: 24 }}>
              AI Reputation<br />
              <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.5)", color: "transparent" }}>Analysis.</span>
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.35)", lineHeight: 1.9, maxWidth: 360 }}>
              Enter any tutor wallet address. TeachAgent reads their EduPay profile and returns an AI score in seconds. Free to use.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <label style={{ ...T.label, display: "block", marginBottom: 16 }}>Tutor wallet address</label>
              <input
                value={tutorAddr}
                onChange={e => setTutorAddr(e.target.value)}
                placeholder="0x50BcA6..."
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 0", color: "#e8e4dc", fontSize: 13, fontWeight: 300, fontFamily: "monospace", outline: "none", letterSpacing: "0.04em" }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(129,140,248,0.5)")}
                onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
              />
              <button
                onClick={runScore}
                disabled={scoring || !tutorAddr.trim()}
                style={{ marginTop: 32, width: "100%", fontSize: 10, fontWeight: 300, letterSpacing: "0.24em", textTransform: "uppercase", color: "#e8e4dc", background: scoring ? "rgba(79,70,229,0.3)" : "rgba(79,70,229,0.65)", border: "none", padding: "18px", cursor: scoring ? "default" : "pointer", fontFamily: "inherit", opacity: !tutorAddr.trim() ? 0.4 : 1 }}
              >
                {scoring ? "Reading onchain data..." : "Run AI score"}
              </button>

              {scoreData && !scoreData.error && (
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                  style={{ marginTop: 56, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 40 }}>
                    <div style={{ fontSize: 88, fontWeight: 100, color: scoreData.scoring?.score >= 70 ? "#818cf8" : "rgba(232,228,220,0.4)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                      {scoreData.scoring?.score}
                    </div>
                    <div>
                      <div style={{ fontSize: 40, fontWeight: 100, color: "#e8e4dc", lineHeight: 1 }}>{scoreData.scoring?.grade}</div>
                      <div style={{ ...T.label, marginTop: 4 }}>out of 100</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.45)", lineHeight: 1.9, marginBottom: 36 }}>{scoreData.scoring?.summary}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                    <div>
                      <div style={{ ...T.accent, marginBottom: 16 }}>Strengths</div>
                      {scoreData.scoring?.strengths?.map((s: string, i: number) => (
                        <p key={i} style={{ fontSize: 12, fontWeight: 300, color: "rgba(232,228,220,0.38)", marginBottom: 10, lineHeight: 1.7 }}>— {s}</p>
                      ))}
                    </div>
                    <div>
                      <div style={{ ...T.label, marginBottom: 16 }}>To improve</div>
                      {scoreData.scoring?.improvements?.map((s: string, i: number) => (
                        <p key={i} style={{ fontSize: 12, fontWeight: 300, color: "rgba(232,228,220,0.38)", marginBottom: 10, lineHeight: 1.7 }}>— {s}</p>
                      ))}
                    </div>
                  </div>
                  {scoreData.scoring?.recommendation && (
                    <p style={{ marginTop: 32, fontSize: 13, fontWeight: 300, color: "#818cf8", lineHeight: 1.7, fontStyle: "italic" }}>
                      "{scoreData.scoring.recommendation}"
                    </p>
                  )}
                </motion.div>
              )}
              {scoreData?.error && <p style={{ marginTop: 24, fontSize: 12, color: "rgba(232,228,220,0.3)", fontWeight: 300 }}>{scoreData.error}</p>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SESSION ── */}
      <section id="session" style={{ ...T.divider, padding: "140px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 120, alignItems: "start" }}>
          <Reveal>
            <p style={{ ...T.label, marginBottom: 32 }}>Ask the agent</p>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 100, letterSpacing: "-0.025em", lineHeight: 1.0, color: "#e8e4dc", textTransform: "uppercase", marginBottom: 24 }}>
              Get answers.<br />
              <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.5)", color: "transparent" }}>Instantly.</span>
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.35)", lineHeight: 1.9, maxWidth: 360, marginBottom: 48 }}>
              Ask TeachAgent anything about blockchain, Celo, or Web3. Costs 0.0001 cUSD per question.
            </p>

            <div style={{ ...T.divider, paddingTop: 48 }}>
              <div style={{ ...T.label, marginBottom: 24 }}>Example questions</div>
              {["What is a smart contract?", "How does cUSD work on Celo?", "How do I deploy to Celo mainnet?"].map((q, i) => (
                <button key={i} onClick={() => setQuestion(q)}
                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 0", fontSize: 12, fontWeight: 300, color: "rgba(232,228,220,0.35)", cursor: "pointer", fontFamily: "inherit", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,228,220,0.35)")}
                >
                  {q} →
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <label style={{ ...T.label, display: "block", marginBottom: 16 }}>Your question</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What is a smart contract?"
                rows={5}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 0", color: "#e8e4dc", fontSize: 14, fontWeight: 300, fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.8 }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(129,140,248,0.5)")}
                onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
              />

              <button
                onClick={askAgent}
                disabled={answering || !question.trim()}
                style={{ marginTop: 32, width: "100%", fontSize: 10, fontWeight: 300, letterSpacing: "0.24em", textTransform: "uppercase", color: "#e8e4dc", background: answering ? "rgba(79,70,229,0.3)" : "rgba(79,70,229,0.65)", border: "none", padding: "18px", cursor: answering ? "default" : "pointer", fontFamily: "inherit", opacity: !question.trim() ? 0.4 : 1 }}
              >
                {!isConnected ? "Connect wallet to ask" : answering ? "Thinking..." : "Ask TeachAgent — 0.0001 cUSD"}
              </button>

              {/* Payment gate */}
              {paymentRequired && paymentInfo && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 32, padding: 32, border: "1px solid rgba(129,140,248,0.2)", background: "rgba(79,70,229,0.05)" }}
                >
                  <div style={{ ...T.accent, marginBottom: 16 }}>Payment required</div>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.45)", lineHeight: 1.8, marginBottom: 8 }}>
                    This session costs <strong style={{ color: "#818cf8" }}>0.0001 cUSD</strong> on Celo mainnet.
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.2)", marginBottom: 8, fontFamily: "monospace" }}>
                    Pay to: {paymentInfo.payTo}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.2)", marginBottom: 24 }}>
                    Compatible with MetaMask, Valora, and MiniPay.
                  </p>
                  {payStatus && (
                    <p style={{ fontSize: 11, color: "#818cf8", marginBottom: 16, fontWeight: 300 }}>{payStatus}</p>
                  )}
                  <button
                    onClick={payAndAsk}
                    disabled={answering}
                    style={{ width: "100%", fontSize: 10, fontWeight: 300, letterSpacing: "0.24em", textTransform: "uppercase", color: "#e8e4dc", background: "rgba(79,70,229,0.8)", border: "none", padding: "16px", cursor: answering ? "default" : "pointer", fontFamily: "inherit" }}
                  >
                    {answering ? payStatus || "Processing..." : "Pay 0.0001 cUSD + Get Answer"}
                  </button>
                </motion.div>
              )}

              {answer && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 48, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div style={{ ...T.accent, marginBottom: 20 }}>Agent response</div>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(232,228,220,0.6)", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{answer}</p>
                </motion.div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ ...T.divider, padding: "100px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
              {[
                { v: "Agent 1", l: "First on Celo" },
                { v: "Llama 3.3", l: "AI model" },
                { v: "0.0001", l: "cUSD per session" },
                { v: "Open", l: "Source & verifiable" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "40px 40px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ fontSize: 28, fontWeight: 100, color: "#818cf8", marginBottom: 12 }}>{s.v}</div>
                  <div style={{ ...T.label }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ ...T.divider, padding: "36px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...T.label }}>TeachAgent · 2026</span>
          <div style={{ display: "flex", gap: 48 }}>
            {[
              { label: "GitHub", href: "https://github.com/Spagero763/TeachAgent" },
              { label: "API", href: AGENT_URL },
              { label: "Contract", href: `https://celoscan.io/address/0xBe9Ddf20E2a0191232a5bf57003ea7A512851391` },
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