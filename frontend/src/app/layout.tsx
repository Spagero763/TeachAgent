import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "TeachAgent — Learn Celo, Pay as You Go",
  description:
    "AI tutor for the Celo blockchain. Ask anything about smart contracts, cUSD, MiniPay, DeFi, and wallets. 0.001 CELO per answer — paid onchain.",
  keywords: ["Celo", "blockchain", "AI tutor", "MiniPay", "cUSD", "Web3", "DeFi", "smart contracts"],
  authors: [{ name: "TeachAgent" }],
  openGraph: {
    title: "TeachAgent — Learn Celo, Pay as You Go",
    description:
      "AI tutor for the Celo blockchain. Ask anything about smart contracts, cUSD, MiniPay, or DeFi. 0.001 CELO per answer.",
    url: "https://teach-agent.vercel.app",
    siteName: "TeachAgent",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "TeachAgent — Learn Celo, Pay as You Go",
    description: "AI tutor for the Celo blockchain. 0.001 CELO per answer — paid onchain.",
  },
  themeColor: "#35D07F",
  other: {
    "talentapp:project_verification":
      "26d93c6c2924a340c78332b6fe2f0b8a063152ed0b4531ac8958758eef58d5f6b928c8275924f0f20b86d0f48751c84023ae34f37c8784122c95f2a7372fde78",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
