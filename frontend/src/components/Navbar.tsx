"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppKit, useAppKitAccount } from "@reown/appkit/react"
import { Logo } from "./Logo"

export function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const { open } = useAppKit()
    const { address, isConnected } = useAppKitAccount()
    const pathname = usePathname()
    const [isMiniPay, setIsMiniPay] = useState(false)

    useEffect(() => {
        setIsMiniPay(!!(window as any).ethereum?.isMiniPay)
        const fn = () => setScrolled(window.scrollY > 8)
        window.addEventListener("scroll", fn)
        return () => window.removeEventListener("scroll", fn)
    }, [])

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 20px", height: 56,
            background: "#fff",
            borderBottom: "1px solid #E2EAE5",
            boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
            transition: "box-shadow 0.2s",
        }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
                <Logo size={32} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0F1F16", letterSpacing: "-0.01em" }}>
                    TeachAgent
                </span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Link href="/" style={{
                    fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, textDecoration: "none",
                    color: pathname === "/" ? "#35D07F" : "#6B7C72",
                    background: pathname === "/" ? "#EBF9F2" : "transparent",
                }}>Chat</Link>

                <Link href="/stats" style={{
                    fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, textDecoration: "none",
                    color: pathname === "/stats" ? "#35D07F" : "#6B7C72",
                    background: pathname === "/stats" ? "#EBF9F2" : "transparent",
                }}>Stats</Link>

                {!isMiniPay && (
                    <button onClick={() => open()} style={{
                        marginLeft: 6, fontSize: 13, fontWeight: 600,
                        padding: "7px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        color: isConnected ? "#35D07F" : "#fff",
                        background: isConnected ? "#EBF9F2" : "#35D07F",
                        border: isConnected ? "1.5px solid #B6EDCF" : "none",
                        transition: "all 0.15s",
                    }}>
                        {isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect"}
                    </button>
                )}

                {isMiniPay && (
                    <div style={{ marginLeft: 6, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#EBF9F2", borderRadius: 10, border: "1.5px solid #B6EDCF" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#35D07F" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#35D07F" }}>MiniPay</span>
                    </div>
                )}
            </div>
        </nav>
    )
}
