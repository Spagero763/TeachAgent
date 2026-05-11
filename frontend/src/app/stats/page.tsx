"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Logo } from "@/components/Logo"

const AGENT_URL = "https://teachagent.onrender.com"

type Stats = {
  totalQuestions: number
  totalCELO: number
  totalCUSD: number
  uniqueUsers: number
  leaderboard: { rank: number; address: string; questions: number }[]
  contract: string
  network: string
  updatedAt: string
}

function StatCard({ label, value, sub, delay = 0 }: { label: string; value: string; sub?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "#fff",
        border: "1px solid #E2EAE5",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 1px 6px rgba(15,31,22,0.06)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#0F1F16", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "rgba(15,31,22,0.4)", marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </motion.div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${AGENT_URL}/agent/stats`)
      .then(r => {
        if (!r.ok) throw new Error(`Backend returned ${r.status}`)
        return r.json()
      })
      .then(d => { setStats(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div style={{ background: "#F0F4F1", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "80px 16px 60px" }}>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Logo size={36} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F1F16", letterSpacing: "-0.02em" }}>
              Live Stats
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "rgba(15,31,22,0.5)", lineHeight: 1.6 }}>
            Real-time on-chain data from the TeachAgent payment contract on Celo Mainnet.
          </p>
          {stats && (
            <p style={{ fontSize: 12, color: "rgba(15,31,22,0.35)", marginTop: 6 }}>
              Updated {new Date(stats.updatedAt).toLocaleTimeString()}
            </p>
          )}
        </motion.div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "40px 0" }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15, ease: "easeInOut" }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#35D07F" }}
              />
            ))}
            <span style={{ fontSize: 14, color: "rgba(15,31,22,0.4)" }}>Loading on-chain data...</span>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "16px 20px" }}
          >
            <p style={{ fontSize: 14, color: "#92630A", fontWeight: 500 }}>Could not load stats: {error}</p>
            <p style={{ fontSize: 13, color: "rgba(15,31,22,0.45)", marginTop: 4 }}>The backend may be waking up. Try refreshing in 30 seconds.</p>
          </motion.div>
        )}

        {stats && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard label="Total Questions" value={stats.totalQuestions.toLocaleString()} sub="CELO + MiniPay" delay={0} />
              <StatCard label="CELO Earned" value={stats.totalCELO.toFixed(3)} sub="via payForQuestion()" delay={0.06} />
              <StatCard label="cUSD Earned" value={(stats.totalCUSD ?? 0).toFixed(3)} sub="via MiniPay" delay={0.12} />
              <StatCard label="Unique Learners" value={stats.uniqueUsers.toLocaleString()} sub="last 500k blocks" delay={0.18} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: "#fff",
                border: "1px solid #E2EAE5",
                borderRadius: 16,
                padding: "20px 24px",
                marginBottom: 24,
                boxShadow: "0 1px 6px rgba(15,31,22,0.06)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Contract</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(15,31,22,0.4)", marginBottom: 3 }}>Network</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#35D07F", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F1F16" }}>{stats.network}</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: "rgba(15,31,22,0.4)", marginBottom: 3 }}>Contract Address</div>
                  <a
                    href={`https://celoscan.io/address/${stats.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, color: "#35D07F", textDecoration: "none", fontFamily: "monospace", wordBreak: "break-all" }}
                  >
                    {stats.contract}
                  </a>
                </div>
              </div>
            </motion.div>

            {stats.leaderboard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "#fff",
                  border: "1px solid #E2EAE5",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 1px 6px rgba(15,31,22,0.06)",
                }}
              >
                <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F0F4F1" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,31,22,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Top Learners</div>
                </div>
                {stats.leaderboard.map((row, i) => (
                  <motion.div
                    key={row.address}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 24px",
                      borderBottom: i < stats.leaderboard.length - 1 ? "1px solid #F0F4F1" : "none",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: row.rank <= 3 ? "#EBF9F2" : "#F5F7F5",
                      border: row.rank <= 3 ? "1.5px solid #B6EDCF" : "1.5px solid #E2EAE5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800,
                      color: row.rank <= 3 ? "#35D07F" : "rgba(15,31,22,0.4)",
                    }}>
                      {row.rank <= 3 ? ["1st", "2nd", "3rd"][row.rank - 1] : row.rank}
                    </div>
                    <a
                      href={`https://celoscan.io/address/${row.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#0F1F16", textDecoration: "none", fontFamily: "monospace" }}
                    >
                      {short(row.address)}
                    </a>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F1F16" }}>{row.questions}</div>
                      <div style={{ fontSize: 12, color: "rgba(15,31,22,0.4)", fontWeight: 500 }}>questions</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#35D07F", fontWeight: 600, minWidth: 60, textAlign: "right" }}>
                      {(row.questions * 0.001).toFixed(3)}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {stats.leaderboard.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                style={{ background: "#fff", border: "1px solid #E2EAE5", borderRadius: 16, padding: "32px 24px", textAlign: "center", boxShadow: "0 1px 6px rgba(15,31,22,0.06)" }}
              >
                <p style={{ fontSize: 14, color: "rgba(15,31,22,0.4)" }}>No leaderboard data yet. Be the first to ask a question!</p>
                <Link href="/" style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 700, color: "#35D07F", textDecoration: "none" }}>
                  Start learning
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}