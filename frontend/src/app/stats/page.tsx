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
      transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
      style={{
        flex: "1 1 150px", padding: "20px 22px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, backdropFilter: "blur(12px)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(237,242,238,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.3rem)", fontWeight: 800, color: "#EDF2EE", letterSpacing: "-0.025em", lineHeight: 1, marginBottom: 5 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#35D07F", fontWeight: 600 }}>{sub}</div>}
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
    <div style={{ background: "#060C14", minHeight: "100vh", color: "#EDF2EE", position: "relative", overflow: "hidden" }}>

      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 56,
        background: "rgba(6,12,20,0.85)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #35D07F, #25A062)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", boxShadow: "0 2px 8px rgba(53,208,127,0.3)" }}>T</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#EDF2EE", letterSpacing: "-0.02em" }}>TeachAgent</span>
        </Link>
        <div style={{ display: "flex", gap: 2 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, textDecoration: "none", color: "rgba(237,242,238,0.45)" }}>Chat</Link>
          <Link href="/stats" style={{ fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, textDecoration: "none", color: "#35D07F", background: "rgba(53,208,127,0.1)" }}>Stats</Link>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "80px 20px 60px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#35D07F", boxShadow: "0 0 10px rgba(53,208,127,0.6)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(53,208,127,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live · Celo Mainnet</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: "#EDF2EE", letterSpacing: "-0.025em", marginBottom: 6 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "rgba(237,242,238,0.4)", fontWeight: 400 }}>Real-time onchain activity from the TeachAgent payment contract</p>
        </motion.div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: 16, height: 16, border: "2px solid rgba(53,208,127,0.2)", borderTopColor: "#35D07F", borderRadius: "50%" }} />
            <span style={{ fontSize: 14, color: "rgba(53,208,127,0.6)", fontWeight: 500 }}>Loading onchain data…</span>
          </div>
        )}

        {error && (
          <div style={{ padding: "14px 18px", background: "rgba(251,204,92,0.07)", border: "1px solid rgba(251,204,92,0.2)", borderRadius: 12, fontSize: 13, color: "rgba(251,204,92,0.7)" }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <StatCard label="Questions Asked" value={stats.totalQuestions.toLocaleString()} sub="onchain transactions" delay={0.05} />
              <StatCard label="CELO Paid" value={stats.totalCELO.toFixed(3)} sub="0.001 CELO each" delay={0.1} />
              <StatCard label="Unique Learners" value={stats.uniqueUsers.toLocaleString()} sub="wallet addresses" delay={0.15} />
            </div>

            {/* Contract info */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ marginBottom: 28, padding: "13px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", backdropFilter: "blur(10px)" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(237,242,238,0.3)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contract</div>
                <a href={`https://celoscan.io/address/${stats.contract}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 600, color: "rgba(53,208,127,0.65)", textDecoration: "none", fontFamily: "monospace" }}>
                  {stats.contract.slice(0, 14)}…{stats.contract.slice(-8)}
                </a>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "rgba(237,242,238,0.3)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Network</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(237,242,238,0.5)" }}>{stats.network}</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 10, color: "rgba(237,242,238,0.3)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Updated</div>
                <span style={{ fontSize: 12, color: "rgba(237,242,238,0.3)" }}>{new Date(stats.updatedAt).toLocaleTimeString()}</span>
              </div>
            </motion.div>

            {/* Leaderboard */}
            {stats.leaderboard.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, type: "spring", stiffness: 240, damping: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(237,242,238,0.3)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.09em" }}>Top Learners</div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(10px)" }}>
                  {stats.leaderboard.map((entry, i) => (
                    <motion.div key={entry.address}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.28 + i * 0.04, type: "spring", stiffness: 280, damping: 26 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "13px 18px",
                        borderBottom: i < stats.leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        background: i === 0 ? "rgba(53,208,127,0.05)" : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 15, minWidth: 26, textAlign: "center" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(237,242,238,0.2)" }}>#{entry.rank}</span>}
                      </span>
                      <a href={`https://celoscan.io/address/${entry.address}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? "#EDF2EE" : "rgba(237,242,238,0.45)", fontFamily: "monospace", flex: 1, textDecoration: "none" }}>
                        {entry.address.slice(0, 10)}…{entry.address.slice(-8)}
                      </a>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? "#35D07F" : "rgba(237,242,238,0.25)", whiteSpace: "nowrap" }}>
                        {entry.questions} {entry.questions === 1 ? "Q" : "Qs"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div style={{ padding: "32px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "rgba(237,242,238,0.3)", marginBottom: 14 }}>No transactions yet. Be the first on the leaderboard.</p>
                <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#35D07F", textDecoration: "none" }}>Ask your first question →</Link>
              </div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 36, textAlign: "center" }}>
              <Link href="/" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 14, fontWeight: 700, color: "#060C14",
                background: "linear-gradient(135deg, #35D07F 0%, #25A062 100%)",
                padding: "12px 28px", borderRadius: 12, textDecoration: "none",
                boxShadow: "0 4px 16px rgba(53,208,127,0.3)",
              }}>
                Ask a Question →
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
