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
    description: "AI agent for educator reputation on Celo",
    url: "https://teachagent.vercel.app",
    icons: ["https://teachagent.vercel.app/favicon.ico"],
  },
  features: { analytics: false, email: false, socials: false },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#4f46e5",
    "--w3m-border-radius-master": "0px",
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