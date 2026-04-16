import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500"],
})

export const metadata: Metadata = {
  title: "TeachAgent — AI Educator Intelligence on Celo",
  description: "AI agent that scores educators and powers tutoring on Celo blockchain",
  other: {
    "talentapp:project_verification":
      "26d93c6c2924a340c78332b6fe2f0b8a063152ed0b4531ac8958758eef58d5f6b928c8275924f0f20b86d0f48751c84023ae34f37c8784122c95f2a7372fde78",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}