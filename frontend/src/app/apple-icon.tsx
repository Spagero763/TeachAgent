import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background: "linear-gradient(135deg, #35D07F 0%, #19B35A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 100,
        fontWeight: 800,
        color: "#fff",
        fontFamily: "sans-serif",
        letterSpacing: "-4px",
      }}
    >
      T
    </div>,
    { ...size }
  )
}