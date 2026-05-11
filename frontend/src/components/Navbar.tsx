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
  const [isMiniPay, setIsMiniPay] = useState(false)

  useEffect(() => {
    setIsMiniPay(!!(window as any).ethereum?.isMiniPay)
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", height: 56,
      background: scrolled ? "rgba(6,12,20,0.85)" : "rgba(6,12,20,0.6)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      transition: "background 0.3s ease",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: "linear-gradient(135deg, #35D07F 0%, #2AB368 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: "#fff",
          boxShadow: "0 2px 8px rgba(53,208,127,0.35)",
        }}>T</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#EDF2EE", letterSpacing: "-0.02em" }}>
          TeachAgent
        </span>
      </Link>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Link href="/" style={{
          fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
          textDecoration: "none", transition: "all 0.15s",
          color: pathname === "/" ? "#35D07F" : "rgba(237,242,238,0.45)",
          background: pathname === "/" ? "rgba(53,208,127,0.1)" : "transparent",
        }}>Chat</Link>

        <Link href="/stats" style={{
          fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8,
          textDecoration: "none", transition: "all 0.15s",
          color: pathname === "/stats" ? "#35D07F" : "rgba(237,242,238,0.45)",
          background: pathname === "/stats" ? "rgba(53,208,127,0.1)" : "transparent",
        }}>Stats</Link>

        {isMiniPay ? (
          <div style={{
            marginLeft: 6, display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            background: "rgba(53,208,127,0.1)",
            border: "1px solid rgba(53,208,127,0.2)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#35D07F" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#35D07F" }}>MiniPay</span>
          </div>
        ) : (
          <button onClick={() => open()} style={{
            marginLeft: 6, fontSize: 13, fontWeight: 600, padding: "7px 16px",
            borderRadius: 9, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            color: isConnected ? "#35D07F" : "#060C14",
            background: isConnected ? "rgba(53,208,127,0.1)" : "#35D07F",
            border: isConnected ? "1px solid rgba(53,208,127,0.25)" : "none",
            boxShadow: isConnected ? "none" : "0 2px 8px rgba(53,208,127,0.3)",
          }}>
            {isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect"}
          </button>
        )}
      </div>
    </nav>
  )
}
