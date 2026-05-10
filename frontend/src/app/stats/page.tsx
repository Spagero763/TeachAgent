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

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "28px 32px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(232,228,220,0.3)", marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 100, color: "#e8e4dc", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, fontWeight: 300, color: "rgba(129,140,248,0.6)", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </motion.div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`${AGENT_URL}/agent/stats`)
      .then(r => r.json())
      .then(d => {
        setStats(d)
        setLoading(false)
      })
      .catch(() => {
        setError("Backend is starting up. Refresh in 30 seconds.")
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e8e4dc" }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px",
        background: "rgba(8,8,8,0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 300, letterSpacing: "0.25em", textTransform: "uppercase", color: "#e8e4dc", textDecoration: "none" }}>
          TeachAgent
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,228,220,0.4)", textDecoration: "none" }}>
            Ask
          </Link>
          <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "#818cf8" }}>
            Stats
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "120px 32px 80px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.28em", textTransform: "uppercase", color: "#818cf8", marginBottom: 16 }}>
            Live · Celo Mainnet
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", fontWeight: 100, letterSpacing: "-0.03em", color: "#e8e4dc", textTransform: "uppercase", marginBottom: 8, lineHeight: 1 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(232,228,220,0.35)", marginBottom: 48 }}>
            Real-time onchain activity from the TeachAgent payment contract
          </p>
        </motion.div>

        {loading && (
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ fontSize: 13, fontWeight: 300, color: "#818cf8", letterSpacing: "0.15em" }}>
            Loading onchain data...
          </motion.div>
        )}

        {error && (
          <div style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.4)", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Key metrics */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 1, marginBottom: 1 }}>
              <Stat label="Questions Asked" value={stats.totalQuestions.toLocaleString()} sub="onchain transactions" />
              <Stat label="CELO Paid" value={stats.totalCELO.toFixed(3)} sub="0.001 CELO per question" />
              <Stat label="Unique Learners" value={stats.uniqueUsers.toLocaleString()} sub="wallet addresses" />
            </div>

            {/* Contract info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ marginTop: 1, padding: "16px 24px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", marginBottom: 48 }}
            >
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.25)", marginBottom: 4 }}>Contract</div>
                <a
                  href={`https://celoscan.io/address/${stats.contract}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, fontWeight: 300, color: "rgba(129,140,248,0.7)", textDecoration: "none", fontFamily: "monospace" }}
                >
                  {stats.contract}
                </a>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.25)", marginBottom: 4 }}>Network</div>
                <span style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.45)" }}>{stats.network}</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,228,220,0.25)", marginBottom: 4 }}>Updated</div>
                <span style={{ fontSize: 11, fontWeight: 300, color: "rgba(232,228,220,0.3)" }}>
                  {new Date(stats.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>

            {/* Leaderboard */}
            {stats.leaderboard.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(232,228,220,0.3)", marginBottom: 20 }}>
                  Top Learners
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  {stats.leaderboard.map((entry, i) => (
                    <motion.div
                      key={entry.address}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        padding: "14px 20px",
                        borderBottom: i < stats.leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        background: i === 0 ? "rgba(129,140,248,0.05)" : "transparent",
                      }}
                    >
                      <span style={{
                        fontSize: 11,
                        fontWeight: i === 0 ? 500 : 300,
                        color: i === 0 ? "#818cf8" : "rgba(232,228,220,0.25)",
                        minWidth: 24,
                        textAlign: "right",
                      }}>
                        {entry.rank}
                      </span>
                      <a
                        href={`https://celoscan.io/address/${entry.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          fontWeight: 300,
                          color: i === 0 ? "rgba(232,228,220,0.8)" : "rgba(232,228,220,0.45)",
                          fontFamily: "monospace",
                          flex: 1,
                          textDecoration: "none",
                        }}
                      >
                        {entry.address.slice(0, 10)}...{entry.address.slice(-8)}
                      </a>
                      <span style={{ fontSize: 11, fontWeight: 300, color: i === 0 ? "#818cf8" : "rgba(232,228,220,0.3)", whiteSpace: "nowrap" }}>
                        {entry.questions} question{entry.questions !== 1 ? "s" : ""}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {stats.leaderboard.length === 0 && (
              <div style={{ padding: "32px", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,228,220,0.3)" }}>
                  No onchain activity yet. Be the first learner.
                </p>
                <Link href="/" style={{ fontSize: 10, color: "#818cf8", letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", marginTop: 12 }}>
                  Ask a question →
                </Link>
              </div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ marginTop: 48, textAlign: "center" }}
            >
              <Link href="/" style={{
                display: "inline-block",
                fontSize: 11, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase",
                color: "#e8e4dc", background: "rgba(79,70,229,0.7)",
                padding: "14px 32px", textDecoration: "none",
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
