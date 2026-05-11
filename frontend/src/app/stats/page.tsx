"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"

const AGENT_URL = "https://teachagent.onrender.com"

type Stats = {
  totalQuestions: number
  totalCELO: number
  uniqueUsers: number
  leaderboard: { rank: number; address: string; questions: number }[]
  contract: string
  network: string
  updatedAt: string
}

function StatCard({ label, value, sub, delay = 0 }: { label: string; value: string; sub?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        flex: "1 1 160px", padding: "20px 24px",
        background: "rgba(53,208,127,0.04)",
        border: "1px solid rgba(53,208,127,0.12)",
        borderRadius: 14,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(232,237,233,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700, color: "#E8EDE9", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "rgba(53,208,127,0.6)", fontWeight: 500 }}>{sub}</div>}
    </motion.div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${AGENT_URL}/agent/stats`)
      .then(async r => {
        if (!r.ok) throw new Error(`Server error (${r.status}) — backend may be starting up`)
        return r.json()
      })
      .then(d => {
        if (d.error) throw new Error(d.error)
        setStats(d)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || "Backend is starting up. Refresh in 30 seconds.")
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ background: "#0A0F0D", minHeight: "100vh", color: "#E8EDE9" }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56,
        background: "rgba(10,15,13,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(53,208,127,0.1)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #35D07F, #FBCC5C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0A0F0D" }}>T</div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#E8EDE9" }}>TeachAgent</span>
        </Link>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 6, textDecoration: "none", color: "rgba(232,237,233,0.5)" }}>Chat</Link>
          <Link href="/stats" style={{ fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 6, textDecoration: "none", color: "#35D07F", background: "rgba(53,208,127,0.08)" }}>Stats</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 20px 60px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#35D07F", boxShadow: "0 0 8px #35D07F" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(53,208,127,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live · Celo Mainnet</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, color: "#E8EDE9", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "rgba(232,237,233,0.4)" }}>
            Real-time onchain activity from the TeachAgent payment contract
          </p>
        </motion.div>

        {loading && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ fontSize: 14, color: "rgba(53,208,127,0.6)", fontWeight: 500 }}>
            Loading onchain data…
          </motion.div>
        )}

        {error && (
          <div style={{ padding: "16px 20px", background: "rgba(251,204,92,0.06)", border: "1px solid rgba(251,204,92,0.2)", borderRadius: 10, fontSize: 13, color: "rgba(251,204,92,0.7)" }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Key metrics */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <StatCard label="Questions Asked" value={stats.totalQuestions.toLocaleString()} sub="onchain transactions" delay={0.1} />
              <StatCard label="CELO Paid" value={stats.totalCELO.toFixed(3)} sub="0.001 CELO each" delay={0.15} />
              <StatCard label="Unique Learners" value={stats.uniqueUsers.toLocaleString()} sub="wallet addresses" delay={0.2} />
            </div>

            {/* Contract info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              style={{ marginBottom: 32, padding: "14px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}
            >
              <div>
                <div style={{ fontSize: 11, color: "rgba(232,237,233,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contract</div>
                <a href={`https://celoscan.io/address/${stats.contract}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 500, color: "rgba(53,208,127,0.6)", textDecoration: "none", fontFamily: "monospace" }}>
                  {stats.contract.slice(0, 12)}…{stats.contract.slice(-8)}
                </a>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(232,237,233,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Network</div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(232,237,233,0.5)" }}>{stats.network}</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 11, color: "rgba(232,237,233,0.3)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Updated</div>
                <span style={{ fontSize: 12, color: "rgba(232,237,233,0.35)" }}>
                  {new Date(stats.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>

            {/* Leaderboard */}
            {stats.leaderboard.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(232,237,233,0.6)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Top Learners
                </div>
                <div style={{ border: "1px solid rgba(53,208,127,0.1)", borderRadius: 12, overflow: "hidden" }}>
                  {stats.leaderboard.map((entry, i) => (
                    <motion.div
                      key={entry.address}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 16, padding: "13px 18px",
                        borderBottom: i < stats.leaderboard.length - 1 ? "1px solid rgba(53,208,127,0.07)" : "none",
                        background: i === 0 ? "rgba(53,208,127,0.05)" : "transparent",
                      }}
                    >
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: i === 0 ? "#35D07F" : i === 1 ? "#FBCC5C" : "rgba(232,237,233,0.25)",
                        minWidth: 20, textAlign: "center",
                      }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${entry.rank}`}
                      </span>
                      <a
                        href={`https://celoscan.io/address/${entry.address}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 500, color: i === 0 ? "#E8EDE9" : "rgba(232,237,233,0.5)", fontFamily: "monospace", flex: 1, textDecoration: "none" }}
                      >
                        {entry.address.slice(0, 10)}…{entry.address.slice(-8)}
                      </a>
                      <span style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? "#35D07F" : "rgba(232,237,233,0.35)", whiteSpace: "nowrap" }}>
                        {entry.questions} {entry.questions === 1 ? "question" : "questions"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div style={{ padding: "32px", border: "1px solid rgba(53,208,127,0.1)", borderRadius: 12, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "rgba(232,237,233,0.3)", marginBottom: 12 }}>No transactions yet. Be the first learner on the leaderboard.</p>
                <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#35D07F", textDecoration: "none" }}>Ask your first question →</Link>
              </div>
            )}

            {/* CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ marginTop: 40, textAlign: "center" }}>
              <Link href="/" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 14, fontWeight: 600, color: "#0A0F0D",
                background: "#35D07F", padding: "12px 28px", borderRadius: 10, textDecoration: "none",
              }}>
                Ask a Question
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
