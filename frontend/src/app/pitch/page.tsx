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
          <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} style={{ fontSize: "clamp(2.4rem, 6.5vw, 4.2rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: 22 }}>
            Verified Celo knowledge,<br /><span style={{ color: GREEN }}>for people and agents.</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }} style={{ fontSize: "clamp(1rem, 2.2vw, 1.25rem)", color: "rgba(15,31,22,0.6)", maxWidth: 660, margin: "0 auto 36px", lineHeight: 1.6, fontWeight: 400 }}>
            An onchain AI agent on Celo that delivers accurate, never-hallucinated Celo answers — to end-users via web &amp; MiniPay, and to other apps &amp; agents via SDK and an A2A endpoint. Every query settles onchain with x402 micropayments.
          </motion.p>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.24 }} style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: DARK, background: "#fff", border: "1px solid #E2EAE5", borderRadius: 100, padding: "8px 18px" }}>teach-agent.vercel.app</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, padding: "8px 18px" }}>ERC-8004 Agent #9099</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, padding: "8px 18px" }}>x402 · A2A · MiniPay</span>
          </motion.div>
        </div>
      </SlideShell>

      {/* ── SLIDE 2: PROBLEM ── */}
      <SlideShell index="02" total="06">
        <motion.div {...fadeUp}><SectionLabel>The Problem</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 36, maxWidth: 800 }}>
            Verified Celo knowledge exists for devs — but <span style={{ color: GREEN }}>not for everyone else</span>.
          </motion.h2>
        <div style={{ display: "grid", gap: 16 }}>
          {[
            ["Dev tools don't reach end-users", "Great resources like Celopedia live inside a developer's IDE via CLI. The 15M+ MiniPay users in Africa can't run `npx skills add` on their phone — they have no verified Celo answer source."],
            ["General AI hallucinates", "ChatGPT and others confidently invent fake contract addresses, wrong APIs, and made-up facts about Celo — dangerous when real money is involved."],
            ["Other agents have no trusted Celo source", "Autonomous agents building on Celo need a verifiable, payable knowledge endpoint to query — not a scraped, hallucination-prone model."],
            ["No payment rail for knowledge", "There's no onchain, pay-per-use way to monetize and meter access to verified knowledge — a core primitive the agent economy needs."],
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
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 18, maxWidth: 800 }}>
            A payable Celo knowledge agent — <span style={{ color: GREEN }}>onchain, and embeddable</span>.
          </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} style={{ fontSize: 17, color: "rgba(15,31,22,0.6)", lineHeight: 1.6, marginBottom: 36, maxWidth: 740 }}>
          TeachAgent is grounded in a verified, regularly-updated Celo knowledge base — never hallucinated. It is both a consumer app AND infrastructure: anyone can use it on web or in MiniPay, and any builder or agent can integrate it. Each query settles onchain via x402, making it a self-sustaining agent with real economic agency.
        </motion.p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            ["Verified, not hallucinated", "Every answer grounded in real, current Celo facts — addresses, RPCs, protocols, docs."],
            ["Reaches end-users", "Works on web and natively inside MiniPay — no CLI, no IDE, no friction."],
            ["Onchain x402 payments", "First query free, then 0.001 CELO (or cUSD), verified onchain before answering."],
            ["Embeddable by builders", "npm SDK + one-line widget so any Celo dApp adds Q&A for its own users."],
            ["Queryable by agents", "An A2A endpoint other autonomous agents call for verified Celo knowledge."],
            ["Self-sustaining agent", "Earns its own onchain revenue — real economic agency, not a free tool."],
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

      {/* ── SLIDE 4: INFRASTRUCTURE ── */}
      <SlideShell index="04" total="06">
        <motion.div {...fadeUp}><SectionLabel>Infrastructure</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 16 }}>
            One agent. <span style={{ color: GREEN }}>Four ways to use it.</span>
          </motion.h2>
        <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} style={{ fontSize: 16, color: "rgba(15,31,22,0.6)", marginBottom: 34, maxWidth: 720, lineHeight: 1.6 }}>
          Verified Celo knowledge becomes a shared, payable primitive other builders and agents depend on — not a closed app.
        </motion.p>
        <div style={{ display: "grid", gap: 14 }}>
          {[
            ["Web & MiniPay app", "End-users ask questions directly at teach-agent.vercel.app or inside MiniPay — mobile-first, cUSD payments, zero setup."],
            ["npm SDK — teachagent-sdk", "Any TypeScript/JS app or agent adds verified Celo Q&A in 3 lines. Published and live on npm."],
            ["Embeddable widget", "One <script> tag drops an “Ask about Celo” assistant into any Celo dApp for its users."],
            ["Agent-to-Agent (A2A) endpoint", "Other autonomous agents query TeachAgent's knowledge with x402 micropayments, following the A2A message envelope."],
          ].map(([title, body], i) => (
            <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 + i * 0.08 }} style={{ display: "flex", gap: 18, alignItems: "center", background: "#fff", border: "1px solid #E2EAE5", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${GREEN} 0%, #19B35A 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 800, boxShadow: "0 4px 12px rgba(53,208,127,0.3)" }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: DARK, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 14, color: "rgba(15,31,22,0.6)", lineHeight: 1.55 }}>{body}</div>
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
          Pulled live from the Celo Mainnet contracts — not estimates.
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
          <a href="https://www.npmjs.com/package/teachagent-sdk" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none", background: "#EBF9F2", border: "1px solid #B6EDCF", borderRadius: 100, padding: "9px 18px" }}>↗ SDK on npm</a>
        </motion.div>
      </SlideShell>

      {/* ── SLIDE 6: WHY DIFFERENT + TECH & TEAM ── */}
      <SlideShell index="06" total="06">
        <motion.div {...fadeUp}><SectionLabel>Why It's Different · Team</SectionLabel></motion.div>
        <motion.h2 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 28 }}>
            Built for Celo's <span style={{ color: GREEN }}>agent economy</span>.
          </motion.h2>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} style={{ background: "#fff", border: "1px solid #E2EAE5", borderRadius: 16, padding: "22px 24px", marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>What makes it unique</div>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              "Consumer-facing + MiniPay-native — reaches users dev tools can't",
              "Onchain x402 micropayments — a working agent-economy primitive",
              "Embeddable: SDK + widget + A2A other builders & agents depend on",
              "ERC-8004 registered (#9099) with verifiable onchain activity",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6L9 17l-5-5" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 14.5, color: "rgba(15,31,22,0.75)", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["Celo Mainnet", "MiniPay (CIP-64 / cUSD)", "ERC-8004", "x402 payments", "A2A endpoint", "Llama 3.3 70B", "Next.js", "Reown AppKit", "teachagent-sdk (npm)"].map((t, i) => (
              <span key={i} style={{ fontSize: 13.5, fontWeight: 600, color: DARK, background: "#fff", border: "1px solid #E2EAE5", borderRadius: 100, padding: "8px 16px" }}>{t}</span>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.22 }} style={{ background: "#fff", border: "1px solid #E2EAE5", borderRadius: 16, padding: "24px 28px", marginBottom: 26 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Builder</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: DARK, marginBottom: 6 }}>Afolabi Emmanuel <span style={{ color: GREEN }}>(Spagero)</span></div>
          <div style={{ fontSize: 15, color: "rgba(15,31,22,0.6)", lineHeight: 1.6, marginBottom: 14 }}>Solo developer from Nigeria 🇳🇬 building accessible onchain tools for the next billion Web3 users.</div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <a href="https://x.com/spagero71" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none" }}>𝕏 @spagero71</a>
            <a href="https://github.com/Spagero763/TeachAgent" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#1B8A4F", textDecoration: "none" }}>GitHub →</a>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.28 }} style={{ textAlign: "center", padding: "32px 24px", background: `linear-gradient(135deg, ${GREEN} 0%, #19B35A 100%)`, borderRadius: 20, boxShadow: "0 10px 30px rgba(53,208,127,0.3)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Try TeachAgent now</div>
          <a href="https://teach-agent.vercel.app" target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, fontWeight: 700, color: "#fff", textDecoration: "underline", textUnderlineOffset: 4 }}>teach-agent.vercel.app</a>
        </motion.div>
      </SlideShell>

    </div>
  )
}
