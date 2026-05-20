"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Logo } from "@/components/Logo"

const AGENT_URL = "https://teachagent.onrender.com"

type Stats = {
  totalQuestions: number
  totalCELO: number
  totalCUSD: number
  uniqueUsers: number
}

const GREEN = "#35D07F"
const DARK = "#0F1F16"
const BG = "#F0F4F1"

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

function SlideShell({ children, index, total }: { children: React.ReactNode; index: string; total: string }) {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 7vw",
        position: "relative",
        borderBottom: "1px solid #E2EAE5",
        background: BG,
      }}
    >
      <div style={{ position: "absolute", top: 28, right: "7vw", fontSize: 12, fontWeight: 600, color: "rgba(15,31,22,0.3)", letterSpacing: "0.1em" }}>
        {index} / {total}
      </div>
      <div style={{ maxWidth: 920, margin: "0 auto", width: "100%" }}>{children}</div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, marginBottom: 28 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "#1B8A4F", textTransform: "uppercase", letterSpacing: "0.08em" }}>{children}</span>
    </div>
  )
}

export default function PitchPage() {
  const [stats, setStats] = useState<Stats>({ totalQuestions: 177, totalCELO: 0.159, totalCUSD: 0.018, uniqueUsers: 16 })

  useEffect(() => {
    fetch(`${AGENT_URL}/agent/stats`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.totalQuestions != null) setStats(d) })
      .catch(() => {})
  }, [])

  const totalValue = (stats.totalCELO + stats.totalCUSD).toFixed(3)

  return (
    <div style={{ background: BG, color: DARK, fontFamily: "inherit" }}>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid #E2EAE5" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Logo size={26} />
          <span style={{ fontSize: 14, fontWeight: 700, color: DARK }}>TeachAgent</span>
        </Link>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,31,22,0.4)" }}>Pitch Deck · Onchain Agents Hackathon</span>
      </div>

      {/* ── SLIDE 1: TITLE ── */}
      <SlideShell index="01" total="06">
        <div style={{ textAlign: "center" }}>
          <motion.div {...fadeUp} style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <Logo size={88} />
          </motion.div>
          <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} style={{ fontSize: "clamp(2.6rem, 7vw, 4.6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 22 }}>
            Learn Celo.<br /><span style={{ color: GREEN }}>Pay as you go.</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }} style={{ fontSize: "clamp(1rem, 2.2vw, 1.3rem)", color: "rgba(15,31,22,0.6)", maxWidth: 620, margin: "0 auto 36px", lineHeight: 1.6, fontWeight: 400 }}>
            An AI tutor for the Celo blockchain. Ask anything, get accurate answers, and pay a tiny fee per question — fully onchain.
          </motion.p>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.24 }} style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: DARK, background: "#fff", border: "1px solid #E2EAE5", borderRadius: 100, padding: "8px 18px" }}>teach-agent.vercel.app</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, padding: "8px 18px" }}>ERC-8004 Agent #9099</span>
          </motion.div>
        </div>
      </SlideShell>

      {/* ── SLIDE 2: PROBLEM ── */}
      <SlideShell index="02" total="06">
        <motion.div {...fadeUp}><SectionLabel>The Problem</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 36, maxWidth: 760 }}>
            Learning crypto is confusing — and AI makes it <span style={{ color: GREEN }}>worse</span>.
          </motion.h2>
        <div style={{ display: "grid", gap: 16 }}>
          {[
            ["Docs overwhelm beginners", "Official blockchain documentation is dense and written for engineers, not newcomers."],
            ["Tutorials go stale fast", "YouTube guides and blog posts are outdated within months as the ecosystem evolves."],
            ["General AI hallucinates", "ChatGPT and others confidently invent fake contract addresses, wrong APIs, and made-up facts — dangerous when real money is involved."],
            ["No trusted on-ramp for the next billion", "For 15M+ MiniPay users entering Web3 across Africa, there's no simple, reliable way to learn Celo in plain language."],
          ].map(([title, body], i) => (
            <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.07 }} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "#fff", border: "1px solid #E2EAE5", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: "#FFF1F0", border: "1px solid #FFD6D2", display: "flex", alignItems: "center", justifyContent: "center", color: "#D14343", fontSize: 16, fontWeight: 800 }}>!</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 14.5, color: "rgba(15,31,22,0.6)", lineHeight: 1.6 }}>{body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </SlideShell>

      {/* ── SLIDE 3: SOLUTION ── */}
      <SlideShell index="03" total="06">
        <motion.div {...fadeUp}><SectionLabel>The Solution</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 18, maxWidth: 780 }}>
            An AI tutor that <span style={{ color: GREEN }}>only knows Celo</span> — and never guesses.
          </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} style={{ fontSize: 17, color: "rgba(15,31,22,0.6)", lineHeight: 1.6, marginBottom: 36, maxWidth: 720 }}>
          TeachAgent is grounded in a verified, regularly-updated knowledge base of real contract addresses, RPC endpoints, protocols, and docs. It charges a tiny onchain fee per answer — making it a self-sustaining agent with real economic agency.
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            ["Verified, not hallucinated", "Every answer is grounded in real, current Celo facts — never invented."],
            ["First question free", "Zero friction to start. Every new wallet gets one free answer."],
            ["0.001 CELO per answer", "Paid and verified onchain before the answer is delivered."],
            ["Native MiniPay support", "Works inside MiniPay using cUSD — auto-handles CIP-64 transactions."],
            ["Conversational memory", "History persists per wallet, so learning continues across sessions."],
            ["Self-sustaining agent", "Earns its own revenue onchain — real economic agency."],
          ].map(([title, body], i) => (
            <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 + i * 0.05 }} style={{ background: "#fff", border: "1px solid #E2EAE5", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EBF9F2", border: "1px solid #B6EDCF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: DARK, marginBottom: 5 }}>{title}</div>
              <div style={{ fontSize: 14, color: "rgba(15,31,22,0.6)", lineHeight: 1.55 }}>{body}</div>
            </motion.div>
          ))}
        </div>
      </SlideShell>

      {/* ── SLIDE 4: HOW IT WORKS ── */}
      <SlideShell index="04" total="06">
        <motion.div {...fadeUp}><SectionLabel>How It Works</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 40 }}>
            Four steps. <span style={{ color: GREEN }}>Seconds, not minutes.</span>
          </motion.h2>
        <div style={{ display: "grid", gap: 14 }}>
          {[
            ["Connect a wallet", "Open in MiniPay, or connect MetaMask, Valora, or Coinbase Wallet on Celo Mainnet."],
            ["Ask anything about Celo", "Smart contracts, MiniPay, stablecoins, DeFi, staking, governance, dev tooling — anything."],
            ["Pay 0.001 CELO onchain", "The first question is free. After that, confirm a micropayment in your wallet (or cUSD via MiniPay)."],
            ["Get a verified answer", "The backend confirms payment onchain, then returns an accurate, sourced answer with a Celoscan link."],
          ].map(([title, body], i) => (
            <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 + i * 0.08 }} style={{ display: "flex", gap: 18, alignItems: "center", background: "#fff", border: "1px solid #E2EAE5", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${GREEN} 0%, #19B35A 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 19, fontWeight: 800, boxShadow: "0 4px 12px rgba(53,208,127,0.3)" }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: DARK, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 14.5, color: "rgba(15,31,22,0.6)", lineHeight: 1.55 }}>{body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </SlideShell>

      {/* ── SLIDE 5: TRACTION ── */}
      <SlideShell index="05" total="06">
        <motion.div {...fadeUp}><SectionLabel>Traction · Live Onchain</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 14 }}>
            Real users. Real <span style={{ color: GREEN }}>onchain</span> transactions.
          </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} style={{ fontSize: 15, color: "rgba(15,31,22,0.5)", marginBottom: 34 }}>
          These numbers are pulled live from the Celo Mainnet contract — not estimates.
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            [stats.totalQuestions.toLocaleString(), "Questions answered"],
            [stats.uniqueUsers.toLocaleString(), "Unique learners"],
            [`${totalValue}`, "CELO + cUSD earned"],
            ["#9099", "ERC-8004 Agent ID"],
          ].map(([value, label], i) => (
            <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 + i * 0.06 }} style={{ background: "#fff", border: "1px solid #E2EAE5", borderRadius: 16, padding: "26px 24px", boxShadow: "0 1px 6px rgba(15,31,22,0.05)" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: DARK, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            </motion.div>
          ))}
        </div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="https://dune.com/spagero763/teachagent-celo-analytics" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, padding: "9px 18px" }}>↗ Live Dune dashboard</a>
          <a href="https://8004scan.io/agents/celo/9099" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, padding: "9px 18px" }}>↗ View on 8004scan</a>
          <a href="https://celoscan.io/address/0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, padding: "9px 18px" }}>↗ Contract on Celoscan</a>
        </motion.div>
      </SlideShell>

      {/* ── SLIDE 6: TECH & TEAM ── */}
      <SlideShell index="06" total="06">
        <motion.div {...fadeUp}><SectionLabel>Tech & Team</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 36 }}>
            Built for Celo, <span style={{ color: GREEN }}>on Celo</span>.
          </motion.h2>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["Celo Mainnet", "MiniPay (CIP-64 / cUSD)", "ERC-8004", "x402 payments", "Llama 3.3 70B", "Next.js 16", "ethers.js v5", "Reown AppKit", "Upstash Redis"].map((t, i) => (
              <span key={i} style={{ fontSize: 13.5, fontWeight: 600, color: DARK, background: "#fff", border: "1px solid #E2EAE5", borderRadius: 100, padding: "8px 16px" }}>{t}</span>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.18 }} style={{ background: "#fff", border: "1px solid #E2EAE5", borderRadius: 16, padding: "26px 28px", marginBottom: 30 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Builder</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: DARK, marginBottom: 6 }}>Afolabi Emmanuel <span style={{ color: GREEN }}>(Spagero)</span></div>
          <div style={{ fontSize: 15, color: "rgba(15,31,22,0.6)", lineHeight: 1.6, marginBottom: 14 }}>Solo developer from Nigeria 🇳🇬 building accessible onchain tools for the next billion Web3 users.</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="https://x.com/spagero71" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none" }}>𝕏 @spagero71</a>
            <a href="https://github.com/Spagero763/TeachAgent" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none" }}>GitHub →</a>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.26 }} style={{ textAlign: "center", padding: "32px 24px", background: `linear-gradient(135deg, ${GREEN} 0%, #19B35A 100%)`, borderRadius: 20, boxShadow: "0 10px 30px rgba(53,208,127,0.3)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Try TeachAgent now</div>
          <a href="https://teach-agent.vercel.app" target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, fontWeight: 700, color: "#fff", textDecoration: "underline", textUnderlineOffset: 4 }}>teach-agent.vercel.app</a>
        </motion.div>
      </SlideShell>

    </div>
  )
}
