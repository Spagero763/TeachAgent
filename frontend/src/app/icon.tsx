import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: "linear-gradient(135deg, #35D07F 0%, #19B35A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        fontWeight: 800,
        color: "#fff",
        fontFamily: "sans-serif",
        letterSpacing: "-1px",
      }}
    >
      T
    </div>,
    { ...size }
  )
}