"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppKit, useAppKitAccount } from "@reown/appkit/react"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 56,
      background: scrolled ? "rgba(10,15,13,0.97)" : "rgba(10,15,13,0.8)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(53,208,127,0.1)",
      transition: "background 0.3s",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #35D07F, #FBCC5C)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#0A0F0D", flexShrink: 0,
        }}>T</div>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#E8EDE9", letterSpacing: "-0.01em" }}>
          TeachAgent
        </span>
      </Link>

      {/* Nav links + connect */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Link href="/" style={{
          fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 6, textDecoration: "none",
          color: pathname === "/" ? "#35D07F" : "rgba(232,237,233,0.5)",
          background: pathname === "/" ? "rgba(53,208,127,0.08)" : "transparent",
          transition: "all 0.2s",
        }}>Chat</Link>

        <Link href="/stats" style={{
          fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 6, textDecoration: "none",
          color: pathname === "/stats" ? "#35D07F" : "rgba(232,237,233,0.5)",
          background: pathname === "/stats" ? "rgba(53,208,127,0.08)" : "transparent",
          transition: "all 0.2s",
        }}>Stats</Link>

        <button
          onClick={() => open()}
          style={{
            marginLeft: 8, fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 8,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            color: isConnected ? "#35D07F" : "#0A0F0D",
            background: isConnected ? "rgba(53,208,127,0.1)" : "#35D07F",
            border: isConnected ? "1px solid rgba(53,208,127,0.3)" : "none",
          }}
        >
          {isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect Wallet"}
        </button>
      </div>
    </nav>
  )
}
