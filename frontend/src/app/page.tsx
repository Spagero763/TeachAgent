"use client"

import { ethers } from "ethers"
import { useRef, useState } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { Navbar } from "@/components/Navbar"
import dynamic from "next/dynamic"

const AgentCanvas = dynamic(
  () => import("@/components/AgentCanvas").then(m => ({ default: m.AgentCanvas })),
  { ssr: false }
)

function Reveal({ children, delay = 0, y = 32 }: {
  children: React.ReactNode
  delay?: number
  y?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

const T = {
  label: {
    fontSize: 10,
    fontWeight: 300,
    letterSpacing: "0.28em",
    textTransform: "uppercase" as const,
    color: "rgba(232,228,220,0.25)",
  },
  accent: {
    fontSize: 10,
    fontWeight: 300,
    letterSpacing: "0.22em",
    textTransform: "uppercase" as const,
    color: "#818cf8",
  },
  divider: {
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
}

export default function Home() {
  const [paymentRequired, setPaymentRequired] = useState(false)
const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const canvasOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const [tutorAddr, setTutorAddr] = useState("")
  const [scoring, setScoring] = useState(false)
  const [scoreData, setScoreData] = useState<any>(null)
  const [question, setQuestion] = useState("")
  const [answering, setAnswering] = useState(false)
  const [answer, setAnswer] = useState("")

  async function runScore() {
    if (!tutorAddr.trim()) return
    setScoring(true)
    setScoreData(null)
    try {
      const r = await fetch("https://teachagent.onrender.com/agent/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorAddress: tutorAddr.trim() }),
      })
      setScoreData(await r.json())
    } catch {
      setScoreData({ error: "Could not reach agent. Try again." })
    } finally {
      setScoring(false)
    }
  }

 async function runSession() {
  if (!question.trim()) return
  setAnswering(true)
  setAnswer("")
  setPaymentRequired(false)

  try {
    // Step 1 — try without payment first
    const r1 = await fetch("https://teachagent.onrender.com/agent/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question.trim(),
        courseTitle: "Blockchain Development on Celo",
        tutorAddress: "0x50BcA645b274A152a1C64B6251C0Ac52725BaAc1",
        studentAddress: "anonymous",
      }),
    })

    if (r1.status === 402) {
      const payData = await r1.json()
      setPaymentInfo(payData)
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
  if (!paymentInfo) return
  setAnswering(true)
  setAnswer("")

  try {
    const eth = (window as any).ethereum
    if (!eth) {
      setAnswer("No wallet found. Install MetaMask or use MiniPay.")
      setAnswering(false)
      return
    }

    const web3Provider = new ethers.providers.Web3Provider(eth)
    await web3Provider.send("eth_requestAccounts", [])
    const signer = web3Provider.getSigner()
    const userAddress = await signer.getAddress()

    const cusd = new ethers.Contract(
      "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      ["function transfer(address to, uint256 amount) external returns (bool)"],
      signer
    )

    const amount = ethers.utils.parseEther("0.001")
    const tx = await cusd.transfer(paymentInfo.payTo, amount)
    const receipt = await tx.wait()

    const r2 = await fetch("https://teachagent.onrender.com/agent/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question.trim(),
        courseTitle: "Blockchain Development on Celo",
        tutorAddress: "0x50BcA645b274A152a1C64B6251C0Ac52725BaAc1",
        studentAddress: userAddress,
        txHash: receipt.transactionHash,
      }),
    })

    const d = await r2.json()
    setAnswer(d.answer || d.error)
    setPaymentRequired(false)
    setPaymentInfo(null)
  } catch (err: any) {
    setAnswer(`Payment failed: ${err?.message || "unknown error"}`)
  } finally {
    setAnswering(false)
  }
}

  return (
    <div style={{ background: "#080808", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{ position: "relative", height: "100vh", overflow: "hidden" }}
      >
        {/* 3D — right side, atmospheric */}
        <motion.div
          style={{
            position: "absolute",
            right: "-5%",
            top: "0",
            width: "55%",
            height: "100%",
            opacity: canvasOpacity,
            zIndex: 0,
          }}
        >
          <AgentCanvas />
        </motion.div>

        {/* Gradient fade left over 3D */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, #080808 35%, rgba(8,8,8,0.7) 60%, transparent 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }} />

        {/* Aurora glow */}
        <div style={{
          position: "absolute",
          right: "10%",
          top: "20%",
          width: 500,
          height: 500,
          background: "radial-gradient(ellipse, rgba(79,70,229,0.07) 0%, transparent 70%)",
          zIndex: 1,
          pointerEvents: "none",
        }} />

        {/* Text — left aligned */}
        <motion.div
          style={{
            position: "absolute",
            left: 60,
            bottom: 80,
            zIndex: 2,
            y: textY,
            opacity: textOpacity,
            maxWidth: 600,
          }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            style={{ ...T.accent, marginBottom: 32 }}
          >
            AI Agent · Celo Mainnet · Agent ID 1
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "clamp(4rem, 9vw, 8rem)",
              fontWeight: 100,
              letterSpacing: "-0.03em",
              lineHeight: 0.92,
              color: "#e8e4dc",
              textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            Teach<br />
            <span style={{
              WebkitTextStroke: "1px rgba(129,140,248,0.6)",
              color: "transparent",
            }}>
              Agent
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9 }}
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: "rgba(232,228,220,0.4)",
              lineHeight: 1.9,
              letterSpacing: "0.02em",
              maxWidth: 380,
              marginBottom: 48,
            }}
          >
            Scores educators on Celo using AI.
            Reputation posted onchain. Sessions paid per question.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            style={{ display: "flex", gap: 16 }}
          >
            <a href="#score" style={{
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#e8e4dc",
              background: "rgba(79,70,229,0.7)",
              padding: "14px 32px",
              textDecoration: "none",
              transition: "background 0.3s",
              border: "1px solid transparent",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(79,70,229,0.9)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(79,70,229,0.7)")}
            >
              Score an educator
            </a>
            <a href="#session" style={{
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(232,228,220,0.4)",
              padding: "14px 32px",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "#e8e4dc"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)" }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(232,228,220,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
            >
              Ask a question
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll guide */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ ...T.label, writingMode: "vertical-rl", letterSpacing: "0.3em" }}>Scroll to explore</span>
          <motion.div
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ width: 1, height: 48, background: "linear-gradient(to bottom, rgba(129,140,248,0.4), transparent)", transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="about" style={{ ...T.divider, padding: "140px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <p style={{ ...T.label, marginBottom: 80 }}>How it works</p>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              {
                step: "01",
                title: "Read onchain data",
                desc: "TeachAgent reads the educator's courses, chapters, and earnings directly from the EduPay smart contract on Celo mainnet. No forms. No trust required.",
              },
              {
                step: "02",
                title: "Score with AI",
                desc: "Llama 3.3 analyzes the educator's course quality, depth, and real student demand. Produces a score from 0–100 with a detailed breakdown.",
              },
              {
                step: "03",
                title: "Post reputation onchain",
                desc: "The score is written permanently to the AgentRegistry contract on Celo. Anyone can verify an educator's reputation without asking TeachAgent.",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div style={{
                  padding: "48px 48px",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <div style={{ ...T.accent, marginBottom: 24 }}>{item.step}</div>
                  <h3 style={{
                    fontSize: 20,
                    fontWeight: 200,
                    color: "#e8e4dc",
                    letterSpacing: "-0.01em",
                    marginBottom: 16,
                    lineHeight: 1.2,
                    textTransform: "uppercase",
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontSize: 13,
                    fontWeight: 300,
                    color: "rgba(232,228,220,0.38)",
                    lineHeight: 1.9,
                    letterSpacing: "0.01em",
                  }}>
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORE ─────────────────────────────────────────── */}
      <section id="score" style={{ ...T.divider, padding: "140px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 120, alignItems: "start" }}>
          <Reveal>
            <p style={{ ...T.label, marginBottom: 32 }}>Score an educator</p>
            <h2 style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 100,
              letterSpacing: "-0.025em",
              lineHeight: 1.0,
              color: "#e8e4dc",
              textTransform: "uppercase",
              marginBottom: 24,
            }}>
              AI Reputation<br />
              <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.5)", color: "transparent" }}>
                Analysis.
              </span>
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.35)", lineHeight: 1.9, maxWidth: 360 }}>
              Enter any tutor's wallet address. TeachAgent reads their EduPay profile and returns an AI-generated score in seconds.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <label style={{ ...T.label, display: "block", marginBottom: 16 }}>
                Tutor wallet address
              </label>
              <input
                value={tutorAddr}
                onChange={e => setTutorAddr(e.target.value)}
                placeholder="0x50BcA6..."
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  padding: "16px 0",
                  color: "#e8e4dc",
                  fontSize: 13,
                  fontWeight: 300,
                  fontFamily: "monospace",
                  outline: "none",
                  letterSpacing: "0.04em",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(129,140,248,0.5)")}
                onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
              />

              <button
                onClick={runScore}
                disabled={scoring || !tutorAddr.trim()}
                style={{
                  marginTop: 32,
                  width: "100%",
                  fontSize: 10,
                  fontWeight: 300,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#e8e4dc",
                  background: scoring ? "rgba(79,70,229,0.3)" : "rgba(79,70,229,0.65)",
                  border: "none",
                  padding: "18px",
                  cursor: scoring ? "default" : "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.3s",
                  opacity: !tutorAddr.trim() ? 0.4 : 1,
                }}
              >
                {scoring ? "Reading onchain data..." : "Run AI score"}
              </button>

              {/* Result */}
              {scoreData && !scoreData.error && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ marginTop: 56, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* Score display */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 40 }}>
                    <div style={{
                      fontSize: 88,
                      fontWeight: 100,
                      color: scoreData.scoring?.score >= 70 ? "#818cf8" : "rgba(232,228,220,0.4)",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                    }}>
                      {scoreData.scoring?.score}
                    </div>
                    <div>
                      <div style={{ fontSize: 40, fontWeight: 100, color: "#e8e4dc", lineHeight: 1 }}>
                        {scoreData.scoring?.grade}
                      </div>
                      <div style={{ ...T.label, marginTop: 4 }}>out of 100</div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.45)", lineHeight: 1.9, marginBottom: 36 }}>
                    {scoreData.scoring?.summary}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                    <div>
                      <div style={{ ...T.accent, marginBottom: 16 }}>Strengths</div>
                      {scoreData.scoring?.strengths?.map((s: string, i: number) => (
                        <p key={i} style={{ fontSize: 12, fontWeight: 300, color: "rgba(232,228,220,0.38)", marginBottom: 10, lineHeight: 1.7 }}>
                          — {s}
                        </p>
                      ))}
                    </div>
                    <div>
                      <div style={{ ...T.label, marginBottom: 16 }}>To improve</div>
                      {scoreData.scoring?.improvements?.map((s: string, i: number) => (
                        <p key={i} style={{ fontSize: 12, fontWeight: 300, color: "rgba(232,228,220,0.38)", marginBottom: 10, lineHeight: 1.7 }}>
                          — {s}
                        </p>
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

              {scoreData?.error && (
                <p style={{ marginTop: 24, fontSize: 12, color: "rgba(232,228,220,0.3)", fontWeight: 300 }}>
                  {scoreData.error}
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SESSION ───────────────────────────────────────── */}
      <section id="session" style={{ ...T.divider, padding: "140px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 120, alignItems: "start" }}>
          <Reveal>
            <p style={{ ...T.label, marginBottom: 32 }}>Ask the agent</p>
            <h2 style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 100,
              letterSpacing: "-0.025em",
              lineHeight: 1.0,
              color: "#e8e4dc",
              textTransform: "uppercase",
              marginBottom: 24,
            }}>
              Get answers.<br />
              <span style={{ WebkitTextStroke: "1px rgba(129,140,248,0.5)", color: "transparent" }}>
                Instantly.
              </span>
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.35)", lineHeight: 1.9, maxWidth: 360 }}>
              Ask TeachAgent anything about blockchain, Celo, or Web3 development. Powered by Llama 3.3, answered in seconds.
            </p>

            {/* Guide */}
            <div style={{ marginTop: 48, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ ...T.label, marginBottom: 24 }}>Example questions</div>
              {[
                "What is a smart contract?",
                "How does cUSD work on Celo?",
                "How do I deploy on Celo mainnet?",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(q)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    padding: "14px 0",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "rgba(232,228,220,0.35)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.01em",
                    transition: "color 0.2s",
                  }}
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
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  padding: "16px 0",
                  color: "#e8e4dc",
                  fontSize: 14,
                  fontWeight: 300,
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.8,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = "rgba(129,140,248,0.5)")}
                onBlur={e => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.1)")}
              />

              <button
                onClick={runSession}
                disabled={answering || !question.trim()}
                style={{
                  marginTop: 32,
                  width: "100%",
                  fontSize: 10,
                  fontWeight: 300,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "#e8e4dc",
                  background: answering ? "rgba(79,70,229,0.3)" : "rgba(79,70,229,0.65)",
                  border: "none",
                  padding: "18px",
                  cursor: answering ? "default" : "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.3s",
                  opacity: !question.trim() ? 0.4 : 1,
                }}
              >
                {answering ? "Thinking..." : "Ask TeachAgent"}
              </button>
              {/* Payment gate */}
{paymentRequired && paymentInfo && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    style={{
      marginTop: 32,
      padding: 32,
      border: "1px solid rgba(129,140,248,0.2)",
      background: "rgba(79,70,229,0.05)",
    }}
  >
    <div style={{ ...T.accent, marginBottom: 16 }}>Payment required</div>
    <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.45)", lineHeight: 1.8, marginBottom: 8 }}>
      This session costs <strong style={{ color: "#818cf8" }}>0.001 cUSD</strong> on Celo.
      Pay with MetaMask, Valora, or MiniPay.
    </p>
    <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.25)", marginBottom: 28, fontFamily: "monospace" }}>
      Pay to: {paymentInfo.payTo?.slice(0, 10)}...{paymentInfo.payTo?.slice(-6)}
    </p>
    <button
      onClick={payAndAsk}
      disabled={answering}
      style={{
        width: "100%",
        fontSize: 10,
        fontWeight: 300,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "#e8e4dc",
        background: "rgba(79,70,229,0.8)",
        border: "none",
        padding: "16px",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {answering ? "Processing payment..." : "Pay 0.001 cUSD + Ask"}
    </button>
  </motion.div>
)}
              {answer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ marginTop: 48, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div style={{ ...T.accent, marginBottom: 20 }}>Agent response</div>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 300,
                    color: "rgba(232,228,220,0.6)",
                    lineHeight: 1.9,
                    whiteSpace: "pre-wrap",
                    letterSpacing: "0.01em",
                  }}>
                    {answer}
                  </p>
                </motion.div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── NUMBERS ───────────────────────────────────────── */}
      <section style={{ ...T.divider, padding: "100px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
              {[
                { v: "Agent 1", l: "First registered on Celo" },
                { v: "Llama 3.3", l: "AI scoring model" },
                { v: "Celo", l: "Network" },
                { v: "Open", l: "Source & verifiable" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "40px 40px",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <div style={{ fontSize: 28, fontWeight: 100, color: "#818cf8", marginBottom: 12, letterSpacing: "-0.01em" }}>
                    {s.v}
                  </div>
                  <div style={{ ...T.label }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ ...T.divider, padding: "36px 60px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...T.label }}>TeachAgent · 2026</span>
          <div style={{ display: "flex", gap: 48 }}>
            <a href="https://github.com/Spagero763/TeachAgent" target="_blank" rel="noopener noreferrer"
              style={{ ...T.label, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e8e4dc")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,228,220,0.25)")}
            >
              GitHub
            </a>
            <a href="https://teachagent.onrender.com" target="_blank" rel="noopener noreferrer"
              style={{ ...T.label, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e8e4dc")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,228,220,0.25)")}
            >
              API
            </a>
            <a href="https://celoscan.io/address/0xBe9Ddf20E2a0191232a5bf57003ea7A512851391" target="_blank" rel="noopener noreferrer"
              style={{ ...T.label, textDecoration: "none", transition: "color 0.2s", fontFamily: "monospace" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e8e4dc")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,228,220,0.25)")}
            >
              Contract
            </a>
          </div>
          <span style={{ ...T.label }}>Celo Mainnet</span>
        </div>
      </footer>
    </div>
  )
}