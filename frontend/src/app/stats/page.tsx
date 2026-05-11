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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{
        flex: "1 1 150px", padding: "18px 20px",
        background: "#fff", border: "1.5px solid #E2EAE5",
        borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#8FA897", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#0F1F16", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>{value}</div>
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
    <div style={{ background: "#F0F4F1", minHeight: "100vh", color: "#0F1F16" }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 56,
        background: "#fff", borderBottom: "1.5px solid #E2EAE5",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "#35D07F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>T</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0F1F16" }}>TeachAgent</span>
        </Link>
        <div style={{ display: "flex", gap: 2 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, textDecoration: "none", color: "#6B7C72" }}>Chat</Link>
          <Link href="/stats" style={{ fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, textDecoration: "none", color: "#35D07F", background: "#EBF9F2" }}>Stats</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "74px 20px 60px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#35D07F" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#35D07F", textTransform: "uppercase", letterSpacing: "0.07em" }}>Live · Celo Mainnet</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, color: "#0F1F16", letterSpacing: "-0.02em", marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "#8FA897" }}>Real-time onchain activity from the TeachAgent payment contract</p>
        </motion.div>

        {loading && (
          <div style={{ fontSize: 14, color: "#35D07F", fontWeight: 600 }}>Loading onchain data…</div>
        )}

        {error && (
          <div style={{ padding: "14px 18px", background: "#FFF8EC", border: "1.5px solid #F5D89A", borderRadius: 10, fontSize: 13, color: "#9A6820" }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Metrics */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <StatCard label="Questions Asked" value={stats.totalQuestions.toLocaleString()} sub="onchain transactions" delay={0.05} />
              <StatCard label="CELO Paid" value={stats.totalCELO.toFixed(3)} sub="0.001 CELO each" delay={0.1} />
              <StatCard label="Unique Learners" value={stats.uniqueUsers.toLocaleString()} sub="wallet addresses" delay={0.15} />
            </div>

            {/* Contract info */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ marginBottom: 24, padding: "12px 18px", background: "#fff", border: "1.5px solid #E2EAE5", borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div>
                <div style={{ fontSize: 11, color: "#8FA897", marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contract</div>
                <a href={`https://celoscan.io/address/${stats.contract}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 600, color: "#35D07F", textDecoration: "none", fontFamily: "monospace" }}>
                  {stats.contract.slice(0, 12)}…{stats.contract.slice(-8)}
                </a>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#8FA897", marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Network</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2D4A38" }}>{stats.network}</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 11, color: "#8FA897", marginBottom: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Updated</div>
                <span style={{ fontSize: 12, color: "#8FA897" }}>{new Date(stats.updatedAt).toLocaleTimeString()}</span>
              </div>
            </motion.div>

            {/* Leaderboard */}
            {stats.leaderboard.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#8FA897", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Top Learners</div>
                <div style={{ background: "#fff", border: "1.5px solid #E2EAE5", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  {stats.leaderboard.map((entry, i) => (
                    <motion.div key={entry.address}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "13px 18px",
                        borderBottom: i < stats.leaderboard.length - 1 ? "1px solid #F0F4F1" : "none",
                        background: i === 0 ? "#F6FDF9" : "#fff",
                      }}
                    >
                      <span style={{ fontSize: 14, minWidth: 24, textAlign: "center" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span style={{ fontSize: 12, fontWeight: 700, color: "#B0C4B8" }}>#{entry.rank}</span>}
                      </span>
                      <a href={`https://celoscan.io/address/${entry.address}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? "#0F1F16" : "#6B7C72", fontFamily: "monospace", flex: 1, textDecoration: "none" }}>
                        {entry.address.slice(0, 10)}…{entry.address.slice(-8)}
                      </a>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? "#35D07F" : "#B0C4B8", whiteSpace: "nowrap" }}>
                        {entry.questions} {entry.questions === 1 ? "Q" : "Qs"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div style={{ padding: "28px", background: "#fff", border: "1.5px solid #E2EAE5", borderRadius: 14, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#8FA897", marginBottom: 12 }}>No transactions yet. Be first on the leaderboard.</p>
                <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#35D07F", textDecoration: "none" }}>Ask your first question →</Link>
              </div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ marginTop: 32, textAlign: "center" }}>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#fff", background: "#35D07F", padding: "12px 28px", borderRadius: 12, textDecoration: "none", boxShadow: "0 2px 8px rgba(53,208,127,0.3)" }}>
                Ask a Question →
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
