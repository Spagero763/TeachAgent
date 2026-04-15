"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAppKit, useAppKitAccount } from "@reown/appkit/react"

const links = [
  { label: "How it works", href: "#about" },
  { label: "Score educator", href: "#score" },
  { label: "Ask agent", href: "#session" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 60px",
        background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.04)" : "none",
        transition: "all 0.5s ease",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.35em", textTransform: "uppercase", color: "#e8e4dc" }}>
        TeachAgent
      </div>

      <div style={{ display: "flex", gap: 48 }}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{
            fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(232,228,220,0.35)", textDecoration: "none", transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#e8e4dc")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,228,220,0.35)")}
          >
            {l.label}
          </a>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => open()}
          style={{
            fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase",
            color: isConnected ? "#818cf8" : "#e8e4dc",
            background: isConnected ? "rgba(79,70,229,0.12)" : "rgba(79,70,229,0.7)",
            border: isConnected ? "1px solid rgba(129,140,248,0.25)" : "none",
            padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
          }}
        >
          {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect wallet"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8" }} />
          <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,228,220,0.3)" }}>
            Celo
          </span>
        </div>
      </div>
    </motion.nav>
  )
}