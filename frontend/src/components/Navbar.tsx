"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const links = [
  { label: "What it does", href: "#about" },
  { label: "Score educator", href: "#score" },
  { label: "Ask agent", href: "#session" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

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
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 60px",
        background: scrolled ? "rgba(8,8,8,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.04)" : "none",
        transition: "all 0.5s ease",
      }}
    >
      {/* Logo */}
      <div style={{ fontSize: 11, fontWeight: 300, letterSpacing: "0.35em", textTransform: "uppercase", color: "#e8e4dc" }}>
        TeachAgent
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: 48 }}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{
            fontSize: 10,
            fontWeight: 300,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(232,228,220,0.35)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#e8e4dc")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,228,220,0.35)")}
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8", opacity: 0.8 }} />
        <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(232,228,220,0.3)" }}>
          Live on Celo
        </span>
      </div>
    </motion.nav>
  )
}