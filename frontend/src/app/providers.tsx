"use client"

import { wagmiAdapter, projectId, networks } from "@/lib/wagmi"
import { createAppKit } from "@reown/appkit/react"
import { celo } from "@reown/appkit/networks"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, type Config } from "wagmi"
import { ReactNode, useState } from "react"

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: celo,
  metadata: {
    name: "TeachAgent",
    description: "AI tutor for the Celo blockchain — 0.001 CELO per question",
    url: "https://teach-agent.vercel.app",
    icons: ["https://teach-agent.vercel.app/favicon.ico"],
  },
  features: { analytics: false, email: false, socials: false },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#35D07F",
    "--w3m-border-radius-master": "2px",
    "--w3m-font-family": "inherit",
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}